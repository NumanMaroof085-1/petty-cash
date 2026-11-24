import { createHash } from 'node:crypto';
import { UnconfirmedError, UserError } from './contracts.ts';
import type { RequestSummary } from './contracts.ts';
import { entityPath, query, stableId, validGuid } from './dataverse-client.ts';
import type { Dataverse, Entity } from './dataverse-client.ts';
import { categories, paymentMethods, paymentSources } from './expenses.ts';
import type { ExpenseDraft, Profile } from './expenses.ts';
import { directoryContact } from './live-accounts.ts';
import type { Contact } from './live-accounts.ts';

type RequestRow = Entity & {
  hr_pettycashrequestid: string; hr_requesttitle: string; hr_transactiondate: string; hr_purpose: string;
  hr_totalamount: number; hr_approvalstatus: number; hr_managercomments?: string; hr_branch: number;
  _hr_submittedby_value: string; pc_submissionstate?: number; pc_submissionsignature?: string;
};
const requestSet = 'hr_pettycashrequests';
const receiptLimit = 10 * 1024 * 1024;
const requestStatus: Record<number, RequestSummary['status']> = {
  123140000: 'Pending', 123140001: 'Approved', 123140002: 'Rejected'
};
const requestFields = [
  'hr_pettycashrequestid', 'hr_requesttitle', 'hr_transactiondate', 'hr_purpose', 'hr_totalamount',
  'hr_approvalstatus', 'hr_managercomments', 'hr_branch', '_hr_submittedby_value', 'pc_submissionstate'
].join(',');

export function minorUnits(value: number): number {
  const cents = Math.round(value * 100);
  if (typeof value !== 'number' || !Number.isSafeInteger(cents) || Math.abs(value * 100 - cents) > 0.000001) {
    throw new Error('Dataverse returned an unsupported currency amount.');
  }
  return cents;
}

export function createLiveRequests(dv: Dataverse, getContact: (id: string) => Promise<Contact | undefined>, currencyId: string, enabled: boolean) {
  const currency = '/' + entityPath('transactioncurrencies', currencyId);
  const context = '_hr_submittedby_value,pc_submissionstate,pc_submissionsignature';
  const requestPath = (id: string) => entityPath(requestSet, id);

  return {
    async createRequest(profile: Profile, draft: ExpenseDraft) {
      if (!enabled) throw new UserError('Live submission is disabled until the approval readiness filter has been set up.');
      const { pdf, ...description } = draft;
      const digest = createHash('sha256').update(JSON.stringify({ description, file: pdf.name })).update(pdf.bytes).digest('hex');
      const id = stableId('request', profile.id, draft.postingKey);
      const path = requestPath(id);
      let existing = await dv.get<RequestRow>(path + query(context));
      if (!existing) {
        const owner = await getContact(profile.id);
        const person = directoryContact(owner);
        if (!person || !owner?._hr_department_value || !owner._hr_reportstomanager_value) {
          throw new UserError('Your Contact needs an active profile, branch, department, and manager before you can submit.');
        }
        await dv.patch(path, {
          hr_requesttitle: 'PCR-' + draft.date.replaceAll('-', '') + '-' + id.slice(0, 8).toUpperCase(),
          hr_transactiondate: draft.date + 'T00:00:00Z', hr_purpose: draft.purpose,
          hr_totalamount: draft.total / 100, hr_approvalstatus: 123140000, hr_erpsyncstatus: 123140000,
          hr_workflowstage: 123140000, hr_branch: person.branch,
          hr_paymentsource: paymentSources[draft.paymentSource as keyof typeof paymentSources],
          hr_paymentmethod: paymentMethods[draft.paymentMethod as keyof typeof paymentMethods],
          pc_submissionstate: 0, pc_submissionsignature: digest,
          'hr_SubmittedBy@odata.bind': '/' + entityPath('contacts', profile.id),
          'hr_Department@odata.bind': '/' + entityPath('hr_departmentses', owner._hr_department_value),
          'hr_AssignedManager@odata.bind': '/' + entityPath('contacts', owner._hr_reportstomanager_value),
          'transactioncurrencyid@odata.bind': currency
        }, { create: true });
        existing = await dv.get<RequestRow>(path + query(context));
      }
      if (!existing) throw new UnconfirmedError('The request save could not be confirmed. Retry this same request.');
      if (existing._hr_submittedby_value !== profile.id || existing.pc_submissionsignature !== digest) {
        throw new UserError('This submission no longer matches its original contents. Open a new request to change it.');
      }
      if (existing.pc_submissionstate === 1) return id;
      if (existing.pc_submissionstate !== 0) throw new UserError('The request is in an unsupported state.');
      for (const [index, line] of draft.items.entries()) {
        await dv.patch(entityPath('hr_pettycashlineitems', stableId('line', id, String(index))), {
          hr_itemname: line.name, hr_quantity: line.quantity, hr_unit: line.unit,
          hr_unitprice: line.unitPrice / 100, hr_totalprice: line.total / 100,
          hr_category: categories[draft.category as keyof typeof categories],
          hr_othercategory: draft.otherCategory || null,
          'hr_ParentRequest@odata.bind': '/' + path, 'transactioncurrencyid@odata.bind': currency
        }, { create: true });
      }
      await dv.call(path + '/hr_receiptimage', {
        method: 'PATCH', headers: { 'Content-Type': 'application/octet-stream', 'x-ms-file-name': pdf.name },
        body: new Uint8Array(pdf.bytes).buffer
      });
      // Upload may itself change the row version. Only one caller can move state 0 to 1.
      for (let attempt = 0; attempt < 3; attempt++) {
        const ready = await dv.get<RequestRow>(path + query(context));
        if (!ready || ready.pc_submissionsignature !== digest || ready._hr_submittedby_value !== profile.id) break;
        if (ready.pc_submissionstate === 1) return id;
        if (ready.pc_submissionstate !== 0 || !ready['@odata.etag']) break;
        if (await dv.patch(path, { pc_submissionstate: 1, hr_workflowstage: 123140000 }, { match: ready['@odata.etag'] })) return id;
      }
      throw new UnconfirmedError('The final submission could not be confirmed. Keep this page open and retry the same request.');
    },
    async listRequests(contactId: string): Promise<RequestSummary[]> {
      const owner = validGuid(contactId);
      const rows = await dv.list<RequestRow>(requestSet + query(requestFields,
        '_hr_submittedby_value eq ' + owner + ' and (pc_submissionstate eq null or pc_submissionstate eq 1)',
        'hr_transactiondate desc,hr_pettycashrequestid desc'));
      return rows.filter(row => row._hr_submittedby_value === owner && row.pc_submissionstate !== 0).map(row => ({
        id: row.hr_pettycashrequestid, title: row.hr_requesttitle, date: row.hr_transactiondate?.slice(0, 10) ?? '',
        purpose: row.hr_purpose, branch: row.hr_branch, category: '', total: minorUnits(row.hr_totalamount),
        status: requestStatus[row.hr_approvalstatus] ?? 'Unknown', comment: row.hr_managercomments
      }));
    },
    async receiptFor(contactId: string, id: string) {
      const path = requestPath(id);
      const row = await dv.get<RequestRow>(path + query('_hr_submittedby_value,pc_submissionstate'));
      if (row?._hr_submittedby_value !== validGuid(contactId) || row.pc_submissionstate === 0) return undefined;
      const response = await dv.call(path + '/hr_receiptimage/$value', { headers: { Accept: 'application/octet-stream' } });
      if (response.status !== 200 || !response.body ||
          Number(response.headers.get('x-ms-file-size') ?? 0) > receiptLimit) {
        await response.body?.cancel();
        return undefined;
      }
      const reader = response.body.getReader();
      const blocks: Uint8Array[] = [];
      let bytes = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > receiptLimit) return undefined;
          blocks.push(value);
        }
        const data = Buffer.concat(blocks);
        if (data.subarray(0, 5).toString() !== '%PDF-') return undefined;
        const filename = (response.headers.get('x-ms-file-name') ?? 'receipt.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-110);
        return { receipt: data, receiptName: filename || 'receipt.pdf' };
      } finally { await reader.cancel().catch(() => {}); }
    }
  };
}
