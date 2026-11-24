import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { branches } from './expenses.ts';
import type { ExpenseDraft, Profile } from './expenses.ts';
import { hashPassword, tokenDigest, verifyPassword } from './passwords.ts';
import { allowedContact, requireRole, UserError } from './contracts.ts';
import type { Activity, Clarification, DirectoryContact, Movement, NewContact, RequestSummary } from './contracts.ts';

const sessionMs = 8 * 60 * 60 * 1000;
const throttleMs = 15 * 60 * 1000;
export const demoEmail = 'employee@pettycash.example';
export const demoContactId = 'ba224cf6-48c1-4dcf-a273-ed4a9a31ade7';

export const demoDepartment = { id: 'f3af59e8-c58e-4fcc-9138-bdc1415978c7', name: 'Operations' };

export function makeDemoStore(filename: string) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    'PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;' +
    'CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,' +
    ' branch INTEGER NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);' +
    'CREATE TABLE IF NOT EXISTS accounts (contactId TEXT PRIMARY KEY REFERENCES contacts(id),' +
    ' passwordHash TEXT, invitationHash TEXT UNIQUE, invitationExpires INTEGER);' +
    'CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, contactId TEXT NOT NULL REFERENCES accounts(contactId),' +
    ' expires INTEGER NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS login_limits (email TEXT PRIMARY KEY, started INTEGER NOT NULL, failures INTEGER NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, contactId TEXT NOT NULL REFERENCES contacts(id),' +
    ' postingKey TEXT NOT NULL, payloadHash TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL,' +
    ' purpose TEXT NOT NULL, branch INTEGER NOT NULL, category TEXT NOT NULL, otherCategory TEXT NOT NULL,' +
    ' paymentSource TEXT NOT NULL, paymentMethod TEXT NOT NULL, total INTEGER NOT NULL, items TEXT NOT NULL,' +
    ' receiptName TEXT NOT NULL, receipt BLOB NOT NULL, created INTEGER NOT NULL, UNIQUE(contactId, postingKey));' +
    'CREATE TABLE IF NOT EXISTS recovery (contactId TEXT PRIMARY KEY REFERENCES accounts(contactId), digest TEXT NOT NULL, expires INTEGER NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS cash (id TEXT PRIMARY KEY, employeeId TEXT NOT NULL REFERENCES contacts(id), actorId TEXT NOT NULL,' +
    ' branch INTEGER NOT NULL, postingKey TEXT NOT NULL UNIQUE, date TEXT NOT NULL, reference TEXT NOT NULL,' +
    ' type INTEGER NOT NULL, amount INTEGER NOT NULL, notes TEXT NOT NULL);' +
    'CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, requestId TEXT UNIQUE NOT NULL REFERENCES requests(id),' +
    ' employeeId TEXT NOT NULL, question TEXT NOT NULL, answer TEXT);'
  );

  function findContact(id: string) {
    return db.prepare('SELECT id, email, name, branch FROM contacts WHERE id = ? AND active = 1')
      .get(id) as DirectoryContact | undefined;
  }

  return {
    close() { db.close(); },
    invite(profile: Profile) {
      const code = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO contacts (id, email, name, branch, role) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .run(profile.id, profile.email, profile.name, profile.branch, profile.role);
      const result = db.prepare(
        'INSERT INTO accounts (contactId, invitationHash, invitationExpires) VALUES (?, ?, ?) ' +
        'ON CONFLICT(contactId) DO UPDATE SET invitationHash = excluded.invitationHash, ' +
        'invitationExpires = excluded.invitationExpires WHERE accounts.passwordHash IS NULL'
      ).run(profile.id, tokenDigest(code), Date.now() + 24 * 60 * 60 * 1000);
      return result.changes > 0 ? code : null;
    },
    async activate(email: string, code: string, password: string) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(code) || password.length < 12 || password.length > 128) return false;
      const digest = tokenDigest(code);
      const current = db.prepare(
        'SELECT a.contactId FROM accounts a JOIN contacts c ON c.id = a.contactId ' +
        'WHERE c.email = ? AND c.active = 1 AND a.invitationHash = ? AND a.invitationExpires > ? AND a.passwordHash IS NULL'
      ).get(email, digest, Date.now()) as { contactId: string } | undefined;
      if (!current) return false;
      const stored = await hashPassword(password);
      const result = db.prepare(
        'UPDATE accounts SET passwordHash = ?, invitationHash = NULL, invitationExpires = NULL ' +
        'WHERE contactId = ? AND invitationHash = ? AND invitationExpires > ? AND passwordHash IS NULL'
      ).run(stored, current.contactId, digest, Date.now());
      return result.changes === 1;
    },
    async signIn(email: string, password: string) {
      if (!email || email.length > 254 || !password || password.length > 128) return null;
      const currentTime = Date.now();
      const limit = db.prepare('SELECT failures FROM login_limits WHERE email = ? AND started > ?')
        .get(email, currentTime - throttleMs) as { failures: number } | undefined;
      if (limit && limit.failures >= 6) return null;
      const account = db.prepare(
        'SELECT a.contactId, a.passwordHash FROM accounts a JOIN contacts c ON c.id = a.contactId ' +
        'WHERE c.email = ? AND c.active = 1'
      ).get(email) as { contactId: string; passwordHash: string | null } | undefined;
      if (!(await verifyPassword(password, account?.passwordHash ?? undefined)) || !account) {
        db.prepare(
          'INSERT INTO login_limits (email, started, failures) VALUES (?, ?, 1) ' +
          'ON CONFLICT(email) DO UPDATE SET failures = CASE WHEN started > ? THEN failures + 1 ELSE 1 END, ' +
          'started = CASE WHEN started > ? THEN started ELSE excluded.started END'
        ).run(email, currentTime, currentTime - throttleMs, currentTime - throttleMs);
        return null;
      }
      db.prepare('DELETE FROM login_limits WHERE email = ? OR started <= ?').run(email, currentTime - throttleMs);
      db.prepare('DELETE FROM sessions WHERE expires <= ?').run(currentTime);
      const token = randomBytes(32).toString('base64url');
      const expires = currentTime + sessionMs;
      db.prepare('INSERT INTO sessions (hash, contactId, expires) VALUES (?, ?, ?)')
        .run(tokenDigest(token), account.contactId, expires);
      return { token, expires };
    },
    sessionProfile(token: string): Profile | undefined {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined;
      return db.prepare(
        'SELECT c.id, c.email, c.name, c.branch, c.role FROM sessions s JOIN contacts c ON c.id = s.contactId ' +
        'WHERE s.hash = ? AND s.expires > ? AND c.active = 1'
      ).get(tokenDigest(token), Date.now()) as Profile | undefined;
    },
    signOut(token: string) {
      db.prepare('DELETE FROM sessions WHERE hash = ?').run(tokenDigest(token));
    },
    issueReset(email: string) {
      const row = db.prepare(
        'SELECT a.contactId FROM accounts a JOIN contacts c ON c.id = a.contactId WHERE c.active = 1 AND c.email = ? AND a.passwordHash IS NOT NULL'
      ).get(email) as { contactId: string } | undefined;
      if (!row) return null;
      const code = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO recovery (contactId, digest, expires) VALUES (?, ?, ?) ON CONFLICT(contactId) DO UPDATE SET digest = excluded.digest, expires = excluded.expires')
        .run(row.contactId, tokenDigest(code), Date.now() + 20 * 60 * 1000);
      return code;
    },
    async resetPassword(email: string, code: string, password: string) {
      if (!/^[A-Za-z0-9_-]{43}$/.test(code) || password.length < 12 || password.length > 128) return false;
      const digest = tokenDigest(code);
      const row = db.prepare('SELECT r.contactId FROM recovery r JOIN contacts c ON c.id = r.contactId WHERE c.active = 1 AND c.email = ? AND r.digest = ? AND r.expires > ?')
        .get(email, digest, Date.now()) as { contactId: string } | undefined;
      if (!row) return false;
      const hash = await hashPassword(password);
      db.exec('BEGIN IMMEDIATE');
      try {
        const consumed = db.prepare('DELETE FROM recovery WHERE contactId = ? AND digest = ? AND expires > ?').run(row.contactId, digest, Date.now());
        if (consumed.changes === 1) {
          db.prepare('UPDATE accounts SET passwordHash = ? WHERE contactId = ?').run(hash, row.contactId);
          db.prepare('DELETE FROM sessions WHERE contactId = ?').run(row.contactId);
          db.prepare('DELETE FROM login_limits WHERE email = ?').run(email);
        }
        db.exec('COMMIT');
        return consumed.changes === 1;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    createRequest(profile: Profile, expense: ExpenseDraft) {
      if (!Object.values(branches).includes(profile.branch)) throw new Error('Your profile needs a branch assignment.');
      const { pdf, ...details } = expense;
      const payloadHash = createHash('sha256').update(JSON.stringify(details)).update(pdf.name).update(pdf.bytes).digest('hex');
      const id = randomUUID();
      const title = 'PCR-' + expense.date.replaceAll('-', '') + '-' + id.slice(0, 6).toUpperCase();
      const row = db.prepare(
        'INSERT INTO requests (id, contactId, postingKey, payloadHash, title, date, purpose, branch, category,' +
        ' otherCategory, paymentSource, paymentMethod, total, items, receiptName, receipt, created) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(contactId, postingKey) DO NOTHING RETURNING id'
      ).get(id, profile.id, expense.postingKey, payloadHash, title, expense.date, expense.purpose, profile.branch,
        expense.category, expense.otherCategory, expense.paymentSource, expense.paymentMethod, expense.total,
        JSON.stringify(expense.items), pdf.name, pdf.bytes, Date.now()) as { id: string } | undefined;
      if (row) return row.id;
      const existing = db.prepare('SELECT id, payloadHash FROM requests WHERE contactId = ? AND postingKey = ?')
        .get(profile.id, expense.postingKey) as { id: string; payloadHash: string };
      if (existing.payloadHash !== payloadHash) throw new Error('This submission was already saved with different details. Reload to start a new request.');
      return existing.id;
    },
    listRequests(contactId: string) {
      return db.prepare(
        "SELECT id, title, date, purpose, branch, category, total, 'Pending' AS status FROM requests " +
        'WHERE contactId = ? ORDER BY created DESC, id DESC'
      ).all(contactId) as RequestSummary[];
    },
    receiptFor(contactId: string, id: string) {
      return db.prepare('SELECT receiptName, receipt FROM requests WHERE id = ? AND contactId = ?')
        .get(id, contactId) as { receiptName: string; receipt: Uint8Array } | undefined;
    },
    directory(actor: Profile) {
      if (actor.role !== 'finance' && actor.role !== 'admin') throw new UserError('You do not have access to the directory.');
      return db.prepare('SELECT id, email, name, branch FROM contacts WHERE active = 1 AND branch = ? ORDER BY name')
        .all(actor.branch) as DirectoryContact[];
    },
    departments(actor: Profile) { requireRole(actor, 'admin'); return [demoDepartment]; },
    createContact(actor: Profile, details: NewContact) {
      requireRole(actor, 'admin');
      allowedContact(actor, findContact(details.managerId));
      if (details.departmentId !== demoDepartment.id) throw new UserError('Choose a valid department.');
      if (db.prepare('SELECT id FROM contacts WHERE email = ?').get(details.email)) throw new UserError('A Contact already uses this email.');
      const id = randomUUID(), name = details.firstName + ' ' + details.lastName;
      db.prepare('INSERT INTO contacts (id, email, name, branch, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, details.email, name, actor.branch, details.role);
      return { id, email: details.email, name, branch: actor.branch };
    },
    inviteContact(actor: Profile, contactId: string) {
      requireRole(actor, 'admin');
      const person = allowedContact(actor, findContact(contactId));
      const row = db.prepare('SELECT role FROM contacts WHERE id = ?').get(contactId) as { role: Profile['role'] };
      if (row.role === 'admin') throw new UserError('This Contact’s role requires a platform administrator.');
      const code = this.invite({ ...person, role: row.role });
      if (!code) throw new UserError('This employee already has a login.');
      return { contact: person, code };
    },
    activity(actor: Profile, contactId: string) {
      const viewingOther = contactId !== actor.id;
      if (viewingOther) {
        requireRole(actor, 'finance');
        allowedContact(actor, findContact(contactId));
      }
      return db.prepare('SELECT id, date, reference, type, amount, notes FROM cash WHERE employeeId = ?' +
        (viewingOther ? ' AND branch = ?' : '') + ' ORDER BY date DESC')
        .all(...(viewingOther ? [contactId, actor.branch] : [contactId])) as Activity[];
    },
    postCash(actor: Profile, movement: Movement) {
      requireRole(actor, 'finance');
      if (movement.employeeId === actor.id) throw new UserError('Another Finance user must record movements for your account.');
      const subject = allowedContact(actor, findContact(movement.employeeId));
      const id = randomUUID(), type = movement.type === 'cash_given' ? 123140000 : 123140002;
      const result = db.prepare('INSERT INTO cash (id, employeeId, actorId, branch, postingKey, date, reference, type, amount, notes) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(postingKey) DO NOTHING')
        .run(id, subject.id, actor.id, subject.branch, movement.postingKey, new Date().toISOString(),
          'DEMO-' + id.slice(0, 8), type, movement.amount, movement.notes);
      if (result.changes === 1) return;
      const match = db.prepare('SELECT 1 FROM cash WHERE postingKey = ? AND employeeId = ? AND actorId = ? AND type = ? AND amount = ? AND notes = ?')
        .get(movement.postingKey, subject.id, actor.id, type, movement.amount, movement.notes);
      if (!match) throw new UserError('This posting key belongs to a movement with different details.');
    },
    listClarifications(actor: Profile) {
      return db.prepare('SELECT id, requestId, question FROM questions WHERE employeeId = ? AND answer IS NULL').all(actor.id) as Clarification[];
    },
    answerClarification(actor: Profile, id: string, answer: string) {
      const result = db.prepare('UPDATE questions SET answer = ? WHERE id = ? AND employeeId = ? AND (answer IS NULL OR answer = ?)')
        .run(answer, id, actor.id, answer);
      if (result.changes !== 1) throw new UserError('This question is unavailable or was already answered.');
    },
    seedClarification(contactId: string, requestId: string, question: string) {
      if (!db.prepare('SELECT 1 FROM requests WHERE id = ? AND contactId = ?').get(requestId, contactId)) {
        throw new Error('The local request was not found.');
      }
      db.prepare('INSERT INTO questions (id, requestId, employeeId, question) VALUES (?, ?, ?, ?) ON CONFLICT(requestId) DO NOTHING')
        .run(randomUUID(), requestId, contactId, question);
    }
  };
}

type DemoStore = ReturnType<typeof makeDemoStore>;
const processStore = globalThis as typeof globalThis & { pettyCashDemoStore?: DemoStore };

export function demoStore() {
  if (process.env.PC_DEMO !== '1') throw new Error('The local demo store requires PC_DEMO=1.');
  const filename = process.env.PC_DEMO_DATABASE ?? 'phase-one.sqlite';
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*\.sqlite$/.test(filename)) throw new Error('Invalid local demo database filename.');
  processStore.pettyCashDemoStore ??= makeDemoStore(resolve('.local', filename));
  return processStore.pettyCashDemoStore;
}
