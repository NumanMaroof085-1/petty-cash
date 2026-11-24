import { randomBytes, randomUUID } from 'node:crypto';
import { allowedContact, configuredRoles, requireRole, tokenPattern, UserError } from './contracts.ts';
import type { DirectoryContact } from './contracts.ts';
import { entityPath, query, stableId, validGuid } from './dataverse-client.ts';
import type { Dataverse, Entity } from './dataverse-client.ts';
import { branches } from './expenses.ts';
import type { BusinessRole, Profile } from './expenses.ts';
import { hashPassword, tokenDigest, verifyPassword } from './passwords.ts';

export type Contact = Entity & {
  contactid: string; emailaddress1: string; fullname: string; hr_branch: number;
  hr_userrole?: number; statecode: number; _hr_department_value?: string; _hr_reportstomanager_value?: string;
};
type Account = Entity & {
  pc_appaccountid: string; pc_emailkey: string; pc_contactid: string; pc_role: BusinessRole; pc_enabled: boolean;
  pc_passwordhash?: string; pc_invitehash?: string; pc_inviteexpires?: string;
  pc_resethash?: string; pc_resetexpires?: string; pc_revision: string;
};
type Session = Entity & { pc_accountid: string; pc_tokenhash: string; pc_revision: string; pc_expires: string };
type Limit = Entity & { pc_started: string; pc_count: number };

export const roleCodes = { employee: 123140000, manager: 123140001, finance: 123140002, admin: 123140003 };
export const contactFields = 'contactid,emailaddress1,fullname,hr_branch,hr_userrole,statecode,_hr_department_value,_hr_reportstomanager_value';
const accountFields = [
  'pc_appaccountid', 'pc_emailkey', 'pc_contactid', 'pc_role', 'pc_enabled', 'pc_passwordhash',
  'pc_invitehash', 'pc_inviteexpires', 'pc_resethash', 'pc_resetexpires', 'pc_revision'
].join(',');

export function emailAddress(value: string) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function directoryContact(row?: Contact): DirectoryContact | undefined {
  if (row?.statecode !== 0 || !Object.values(branches).includes(row.hr_branch)) return undefined;
  const email = emailAddress(row.emailaddress1 ?? '');
  if (!email) return undefined;
  return { id: validGuid(row.contactid), name: row.fullname, email, branch: row.hr_branch };
}

const expiration = (minutes: number) => new Date(Date.now() + minutes * 60000).toISOString();
const current = (time?: string) => Boolean(time && Date.parse(time) > Date.now());
const freshCode = () => randomBytes(32).toString('base64url');
const accountPath = (id: string) => entityPath('pc_appaccounts', id);
const matchesRow = (record: Entity) => {
  if (!record['@odata.etag']) throw new Error('Dataverse did not return the row version.');
  return { match: record['@odata.etag'] };
};

export function createLiveAccounts(dv: Dataverse) {
  const sessionPath = (digest: string) => entityPath('pc_appsessions', stableId('session', digest));
  const contact = (id: string) => dv.get<Contact>(entityPath('contacts', id) + query(contactFields));
  const byId = (id: string) => dv.get<Account>(accountPath(id) + query(accountFields));

  async function accountByEmail(email: string) {
    const key = tokenDigest(email);
    const rows = await dv.list<Account>('pc_appaccounts' + query(accountFields, "pc_emailkey eq '" + key + "'"), 1);
    if (rows.length > 1) throw new Error('Duplicate application accounts.');
    return rows[0];
  }

  async function takeAttempt(action: 'sign-in' | 'recover' | 'activate', email: string, limit: number) {
    const path = entityPath('pc_appthrottles', stableId('throttle', action, email));
    for (let attempt = 0; attempt < 3; attempt++) {
      const row = await dv.get<Limit>(path + query('pc_started,pc_count'));
      const now = new Date().toISOString();
      if (!row) {
        if (await dv.patch(path, { pc_name: action, pc_started: now, pc_count: 1 }, { create: true })) return true;
      } else {
        const open = Date.parse(row.pc_started) + 15 * 60000 > Date.now();
        if (open && row.pc_count >= limit) return false;
        if (await dv.patch(path, { pc_started: open ? row.pc_started : now, pc_count: open ? row.pc_count + 1 : 1 }, matchesRow(row))) return true;
      }
    }
    return false;
  }

  async function profileFor(account?: Account): Promise<Profile | undefined> {
    if (!account?.pc_enabled || !configuredRoles.includes(account.pc_role)) return undefined;
    const row = await contact(account.pc_contactid);
    const directory = directoryContact(row);
    if (directory && roleCodes[account.pc_role] === row?.hr_userrole && tokenDigest(directory.email) === account.pc_emailkey) {
      return { ...directory, role: account.pc_role };
    }
  }

  async function issueInvitation(person: DirectoryContact, role: BusinessRole) {
    const id = stableId('account', person.id);
    const row = await byId(id);
    if (row?.pc_passwordhash) throw new UserError('This employee already has a login. They can reset their password from the sign-in page.');
    if (row && row.pc_role !== role) throw new UserError('The existing account role needs to be reviewed by a platform administrator.');
    const code = freshCode();
    if (!await dv.patch(accountPath(id), {
      pc_name: person.id, pc_contactid: person.id, pc_emailkey: tokenDigest(person.email),
      pc_enabled: true, pc_role: role, pc_revision: randomUUID(), pc_invitehash: tokenDigest(code), pc_inviteexpires: expiration(24 * 60)
    }, row ? matchesRow(row) : { create: true })) {
      throw new UserError('The account changed while issuing its invitation. Try again.');
    }
    return { contact: person, code };
  }

  async function setPassword(email: string, code: string, password: string, kind: 'activate' | 'recover') {
    if (!emailAddress(email) || !tokenPattern.test(code) || password.length < 12 || password.length > 128 ||
        !await takeAttempt(kind, email, 8)) return false;
    const row = await accountByEmail(email);
    const digest = tokenDigest(code);
    const valid = kind === 'activate'
      ? !row?.pc_passwordhash && row?.pc_invitehash === digest && current(row.pc_inviteexpires)
      : Boolean(row?.pc_passwordhash) && row?.pc_resethash === digest && current(row.pc_resetexpires);
    if (!row || !valid || !await profileFor(row)) return false;
    return dv.patch(accountPath(row.pc_appaccountid), {
      pc_passwordhash: await hashPassword(password), pc_revision: randomUUID(),
      pc_invitehash: null, pc_inviteexpires: null, pc_resethash: null, pc_resetexpires: null
    }, matchesRow(row));
  }

  return {
    contact,
    async bootstrapAdmin(contactId: string) {
      const row = await contact(contactId);
      const person = directoryContact(row);
      if (!person || row?.hr_userrole !== roleCodes.admin) {
        throw new UserError('Choose an active Contact with the Admin business role, a branch, and an email address.');
      }
      return issueInvitation(person, 'admin');
    },
    async inviteContact(actor: Profile, contactId: string) {
      requireRole(actor, 'admin');
      const row = await contact(contactId);
      const person = allowedContact(actor, directoryContact(row));
      const role = (['employee', 'manager', 'finance'] as const).find(item => roleCodes[item] === row?.hr_userrole);
      if (!role) throw new UserError('This Contact’s role requires a platform administrator.');
      return issueInvitation(person, role);
    },
    activate(email: string, code: string, password: string) { return setPassword(email, code, password, 'activate'); },
    resetPassword(email: string, code: string, password: string) { return setPassword(email, code, password, 'recover'); },
    async issueReset(email: string) {
      if (!emailAddress(email) || !await takeAttempt('recover', email, 4)) return null;
      const account = await accountByEmail(email);
      if (!account?.pc_passwordhash || !await profileFor(account)) return null;
      const code = freshCode();
      return await dv.patch(accountPath(account.pc_appaccountid), {
        pc_resethash: tokenDigest(code), pc_resetexpires: expiration(20)
      }, matchesRow(account)) ? code : null;
    },
    async signIn(email: string, password: string) {
      if (!emailAddress(email) || !password || password.length > 128 || !await takeAttempt('sign-in', email, 8)) return null;
      const row = await accountByEmail(email);
      if (!await verifyPassword(password, row?.pc_passwordhash) || !row || !await profileFor(row)) return null;
      const token = freshCode(), digest = tokenDigest(token), expires = expiration(8 * 60);
      if (!await dv.patch(sessionPath(digest), {
        pc_name: row.pc_appaccountid, pc_accountid: row.pc_appaccountid, pc_tokenhash: digest,
        pc_revision: row.pc_revision, pc_expires: expires
      }, { create: true })) throw new Error('Unable to create a login session.');
      return { token, expires: Date.parse(expires) };
    },
    async sessionProfile(token: string) {
      if (!tokenPattern.test(token)) return undefined;
      const digest = tokenDigest(token);
      const session = await dv.get<Session>(sessionPath(digest) + query('pc_accountid,pc_tokenhash,pc_revision,pc_expires'));
      if (!session || session.pc_tokenhash !== digest || !current(session.pc_expires)) return undefined;
      const account = await byId(session.pc_accountid);
      if (account?.pc_revision === session.pc_revision) return profileFor(account);
    },
    async signOut(token: string) {
      if (!tokenPattern.test(token)) return;
      const path = sessionPath(tokenDigest(token));
      if (await dv.get(path + query('pc_appsessionid'))) {
        await dv.patch(path, { pc_expires: new Date().toISOString() }, { match: '*' });
      }
    }
  };
}
