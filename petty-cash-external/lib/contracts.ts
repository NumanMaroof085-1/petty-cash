import type { ExpenseDraft, Profile, BusinessRole } from './expenses.ts';

type Result<T> = T | Promise<T>;
export type DirectoryContact = Pick<Profile, 'id' | 'email' | 'name' | 'branch'>;
export type NewContact = {
  firstName: string; lastName: string; email: string; departmentId: string; managerId: string; role: Exclude<BusinessRole, 'admin'>;
};
export type RequestSummary = {
  id: string; title: string; date: string; purpose: string; branch: number;
  category: string; total: number; status: 'Pending' | 'Approved' | 'Rejected' | 'Unknown'; comment?: string;
};
export type Clarification = { id: string; requestId: string; question: string };
export type Movement = { employeeId: string; type: 'cash_given' | 'cash_returned'; amount: number; notes: string; postingKey: string };
export type Activity = { id: string; date: string; reference: string; type: number; amount: number; notes: string; requestId?: string };

export interface WorkspaceStore {
  activate(email: string, code: string, password: string): Result<boolean>;
  signIn(email: string, password: string): Result<{ token: string; expires: number } | null>;
  signOut(token: string): Result<void>;
  sessionProfile(token: string): Result<Profile | undefined>;
  issueReset(email: string): Result<string | null>;
  resetPassword(email: string, code: string, password: string): Result<boolean>;
  createRequest(profile: Profile, draft: ExpenseDraft): Result<string>;
  listRequests(id: string): Result<RequestSummary[]>;
  receiptFor(contactId: string, id: string): Result<{ receiptName: string; receipt: Uint8Array } | undefined>;
  listClarifications(profile: Profile): Result<Clarification[]>;
  answerClarification(profile: Profile, id: string, answer: string): Result<void>;
  directory(profile: Profile): Result<DirectoryContact[]>;
  departments(profile: Profile): Result<{ id: string; name: string }[]>;
  activity(profile: Profile, contactId: string): Result<Activity[]>;
  postCash(profile: Profile, movement: Movement): Result<void>;
  createContact(profile: Profile, details: NewContact): Result<DirectoryContact>;
  inviteContact(profile: Profile, contactId: string): Result<{ contact: DirectoryContact; code: string }>;
}

export const guidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
export const configuredRoles = ['employee', 'manager', 'finance', 'admin'] as const;
export const cashLabels: Record<number, string> = { 123140000: 'Advance given', 123140001: 'Expense approved', 123140002: 'Cash returned' };
export class UserError extends Error {}
export class UnconfirmedError extends UserError {}

export function signedBalance(activity: Activity[]): number {
  const seen = new Set<string>();
  return activity.reduce((sum, row) => {
    if (!Object.hasOwn(cashLabels, row.type) || !Number.isSafeInteger(row.amount) || row.amount <= 0) {
      throw new UserError('The ledger has an unsupported transaction. Ask Finance to review it.');
    }
    if (row.type === 123140001) {
      if (!row.requestId || seen.has(row.requestId)) throw new UserError('The ledger contains a missing or repeated expense reference.');
      seen.add(row.requestId);
    }
    const next = sum + (row.type === 123140000 ? row.amount : -row.amount);
    if (!Number.isSafeInteger(next)) throw new UserError('The ledger balance is outside the supported range.');
    return next;
  }, 0);
}

export function requireRole(profile: Profile, role: BusinessRole) {
  if (profile.role !== role) throw new UserError('You do not have access to this action.');
}

export function allowedContact(actor: Profile, target: DirectoryContact | undefined): DirectoryContact {
  if (!target || target.branch !== actor.branch) throw new UserError('Choose an active employee in your branch.');
  return target;
}
