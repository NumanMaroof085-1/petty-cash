import { allowedContact, guidPattern, requireRole, signedBalance, UnconfirmedError, UserError } from './contracts.ts';
import type { Activity, Clarification, DirectoryContact, Movement, NewContact } from './contracts.ts';
import { entityPath, odataText, query, stableId, validGuid } from './dataverse-client.ts';
import type { Dataverse, Entity } from './dataverse-client.ts';
import type { Profile } from './expenses.ts';
import { contactFields, directoryContact, roleCodes } from './live-accounts.ts';
import type { Contact } from './live-accounts.ts';
import { minorUnits } from './live-requests.ts';

type Question = Entity & {
  hr_requestclarificationid: string; hr_question: string; hr_clarificationstatus: number;
  _hr_employee_value: string; _hr_request_value: string;
};
type Ledger = Entity & {
  hr_cashtransactionid: string; hr_transactionreference: string; hr_transactiontype: number;
  hr_amount: number; hr_notespurpose?: string; _hr_linkedrequest_value?: string; _hr_employee_value: string;
  createdon: string; hr_branch: number;
};

export function createFlowClient(getToken: (scope: string) => Promise<string>, fetcher: typeof fetch = fetch) {
  return async function callFlow(endpoint: string, payload: Record<string, unknown>) {
    const url = new URL(endpoint);
    const permitted = ['.api.powerplatform.com', '.logic.azure.com'].some(suffix => url.hostname.endsWith(suffix));
    if (url.protocol !== 'https:' || !permitted || url.username || url.password || url.hash ||
        [...url.searchParams.keys()].some(key => key.toLowerCase() === 'sig')) {
      throw new Error('Configure an authenticated Power Automate endpoint without a SAS signature.');
    }
    const token = await getToken(process.env.PC_FLOW_SCOPE || 'https://service.flow.microsoft.com/.default');
    const response = await fetcher(url, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(35000),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.status !== 200) throw new Error('Power Automate did not confirm the action.');
    return await response.json() as Record<string, unknown>;
  };
}

const clarificationFields = 'hr_requestclarificationid,hr_question,hr_clarificationstatus,_hr_employee_value,_hr_request_value';
const readField = (row: Record<string, unknown>, name: string) => row[name] ?? row[name.toLowerCase()];
const responseGuid = (value: unknown) => typeof value === 'string' && guidPattern.test(value) ? value.toLowerCase() : '';

export function createLiveWorkspace(
  dv: Dataverse,
  getContact: (id: string) => Promise<Contact | undefined>,
  callFlow: ReturnType<typeof createFlowClient>
) {
  const readContact = async (id: string): Promise<DirectoryContact | undefined> => directoryContact(await getContact(id));

  async function directory(actor: Profile) {
    if (actor.role !== 'finance' && actor.role !== 'admin') throw new UserError('You do not have access to the directory.');
    const rows = await dv.list<Contact>('contacts' + query(contactFields,
      'statecode eq 0 and hr_branch eq ' + actor.branch, 'fullname asc'));
    return rows.map(directoryContact).filter((row): row is DirectoryContact => Boolean(row && row.branch === actor.branch));
  }

  async function createContact(actor: Profile, details: NewContact) {
      requireRole(actor, 'admin');
      allowedContact(actor, await readContact(details.managerId));
      const department = await dv.get<Entity & { statecode: number }>(entityPath('hr_departmentses', details.departmentId) + query('statecode'));
      if (department?.statecode !== 0) throw new UserError('Choose an active department.');
      const duplicates = await dv.list<Contact>('contacts' + query('contactid', 'emailaddress1 eq ' + odataText(details.email)), 1);
      if (duplicates.length) throw new UserError('A Contact already uses this email. Select that Contact to invite them.');
      const id = stableId('new-contact', details.email);
      if (!await dv.patch(entityPath('contacts', id), {
        firstname: details.firstName, lastname: details.lastName, emailaddress1: details.email,
        hr_branch: actor.branch, hr_userrole: roleCodes[details.role],
        'hr_Department@odata.bind': '/' + entityPath('hr_departmentses', details.departmentId),
        'hr_ReportsToManager@odata.bind': '/' + entityPath('contacts', details.managerId)
      }, { create: true })) {
        throw new UserError('The Contact was already created. Refresh the directory before creating another.');
      }
      const saved = await readContact(id);
      if (!saved || saved.branch !== actor.branch || saved.email !== details.email) {
        throw new UserError('The Contact save could not be confirmed. Refresh the directory before trying again.');
      }
      return saved;
  }

  async function activity(actor: Profile, contactId: string): Promise<Activity[]> {
      const owner = validGuid(contactId);
      const viewingOther = owner !== actor.id;
      if (viewingOther) {
        requireRole(actor, 'finance');
        allowedContact(actor, await readContact(owner));
      }
      const filter = '_hr_employee_value eq ' + owner + (viewingOther ? ' and hr_branch eq ' + actor.branch : '');
      const rows = await dv.list<Ledger>('hr_cashtransactions' + query(
        'hr_cashtransactionid,hr_transactionreference,hr_transactiontype,hr_amount,hr_notespurpose,createdon,' +
        '_hr_linkedrequest_value,_hr_employee_value,hr_branch', filter, 'createdon desc,hr_cashtransactionid desc'));
      if (rows.some(row => row._hr_employee_value !== owner || (viewingOther && row.hr_branch !== actor.branch))) {
        throw new Error('Ledger ownership or branch mismatch.');
      }
      return rows.map(row => ({
        id: row.hr_cashtransactionid, date: row.createdon, reference: row.hr_transactionreference,
        type: row.hr_transactiontype, amount: minorUnits(row.hr_amount), notes: row.hr_notespurpose ?? '',
        requestId: row._hr_linkedrequest_value
      }));
  }

  return {
    directory, activity, createContact,
    async departments(actor: Profile) {
      requireRole(actor, 'admin');
      const rows = await dv.list<Entity & { hr_departmentsid: string; hr_departmentname: string }>(
        'hr_departmentses' + query('hr_departmentsid,hr_departmentname', 'statecode eq 0', 'hr_departmentname asc'));
      return rows.map(row => ({ id: row.hr_departmentsid, name: row.hr_departmentname }));
    },
    async postCash(actor: Profile, movement: Movement) {
      requireRole(actor, 'finance');
      if (movement.employeeId === actor.id) throw new UserError('Another Finance user must record movements for your account.');
      const endpoint = process.env.PC_FINANCE_FLOW_URL;
      if (!endpoint) throw new UserError('The authenticated Finance workflow is not configured.');
      signedBalance(await activity(actor, movement.employeeId));
      try {
        const result = await callFlow(endpoint, {
          callerContactId: actor.id, employeeId: movement.employeeId, movement: movement.type,
          amount: movement.amount / 100, notes: movement.notes, postingKey: movement.postingKey
        });
        if (responseGuid(readField(result, 'postingKey')) !== movement.postingKey ||
            responseGuid(readField(result, 'employeeId')) !== movement.employeeId) throw new Error('Unconfirmed posting.');
        if (result.status === 'rejected') throw new UserError('The Finance workflow rejected this movement. Review the details or ask Finance support to check the flow.');
        if (result.status !== 'posted' || !responseGuid(readField(result, 'transactionId'))) throw new Error('Unconfirmed posting.');
      } catch (error) {
        if (error instanceof UserError) throw error;
        throw new UnconfirmedError('The posting was not confirmed. Keep this page open and retry only the same details. Posting key: ' + movement.postingKey);
      }
    },
    async listClarifications(actor: Profile): Promise<Clarification[]> {
      const rows = await dv.list<Question>('hr_requestclarifications' + query(clarificationFields,
        '_hr_employee_value eq ' + validGuid(actor.id) + ' and hr_clarificationstatus eq 123140000', 'createdon desc'));
      return rows.filter(row => row._hr_employee_value === actor.id && row.hr_clarificationstatus === 123140000)
        .map(row => ({ id: row.hr_requestclarificationid, requestId: row._hr_request_value, question: row.hr_question }));
    },
    async answerClarification(actor: Profile, id: string, answer: string) {
      const question = await dv.get<Question>(entityPath('hr_requestclarifications', id) + query(clarificationFields));
      if (question?._hr_employee_value !== actor.id) throw new UserError('This question is unavailable.');
      const endpoint = process.env.PC_CLARIFICATION_FLOW_URL;
      if (!endpoint) throw new UserError('The authenticated clarification workflow is not configured.');
      try {
        const result = await callFlow(endpoint, { callerContactId: actor.id, clarificationId: id, answer });
        if (result.status !== 'answered' || validGuid(readField(result, 'clarificationId')) !== id) throw new Error('Unconfirmed answer.');
      } catch {
        throw new UnconfirmedError('The answer was not confirmed. Keep this page open and retry only the same answer.');
      }
    }
  };
}
