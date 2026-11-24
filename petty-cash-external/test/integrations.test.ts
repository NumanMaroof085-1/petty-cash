import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { branches } from '../lib/expenses.ts';
import type { ExpenseDraft, Profile } from '../lib/expenses.ts';
import { createDataverse, DataverseError } from '../lib/dataverse-client.ts';
import { makeDemoStore } from '../lib/demo-store.ts';
import { createLiveRequests } from '../lib/live-requests.ts';
import { createFlowClient, createLiveWorkspace } from '../lib/live-workspace.ts';
import { signedBalance, UnconfirmedError } from '../lib/contracts.ts';

const profile = (role: Profile['role'], branch = branches.Lahore): Profile => ({
  id: randomUUID(), email: role + '@example.test', name: role, branch, role
});
const contact = (person: Profile) => ({
  contactid: person.id, emailaddress1: person.email, fullname: person.name,
  hr_branch: person.branch, statecode: 0, _hr_department_value: randomUUID(), _hr_reportstomanager_value: randomUUID()
});
const apiOrigin = 'https://test.crm15.dynamics.com';

test('Dataverse gates approval until two items and the PDF exist, and a retry creates no duplicates', async () => {
  const owner = profile('employee'), another = profile('employee');
  const currency = randomUUID();
  const draft: ExpenseDraft = {
    postingKey: randomUUID(), date: '2026-11-24', purpose: 'Office supplies', category: 'Others', otherCategory: 'Stationery',
    items: [{ name: 'Paper', quantity: 1.25, unit: 'Pack', unitPrice: 4000, total: 5000 },
      { name: 'Tape', quantity: 2, unit: 'Roll', unitPrice: 1500, total: 3000 }],
    total: 8000, paymentSource: 'Company Cash', paymentMethod: 'Cash',
    pdf: { name: 'receipt.pdf', bytes: Buffer.from('%PDF-1.7\n%%EOF') }
  };
  const lines = new Map<string, Record<string, unknown>>();
  const patches: string[] = [];
  let header: Record<string, unknown> | undefined;
  let failUpload = true, uploaded = false;
  const dv = createDataverse(apiOrigin, async () => 'sample-token', async (value, init) => {
    const url = new URL(value instanceof Request ? value.url : value);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('authorization'), 'Bearer sample-token');
    assert.equal(init?.redirect, 'error');
    const path = url.pathname;
    if (path.endsWith('/$value')) return new Response(draft.pdf.bytes as Uint8Array<ArrayBuffer>);
    if (init?.method !== 'PATCH') {
      if (path.endsWith('/hr_pettycashrequests')) return Response.json({ value: [header] });
      return header ? Response.json(header) : new Response(null, { status: 404 });
    }
    if (path.endsWith('/hr_receiptimage')) {
      patches.push('PDF');
      assert.equal(headers.get('x-ms-file-name'), 'receipt.pdf');
      assert.equal(lines.size, 2);
      if (failUpload) { failUpload = false; return new Response(null, { status: 500 }); }
      assert.deepEqual(Buffer.from(init.body as ArrayBuffer), draft.pdf.bytes);
      uploaded = true;
      header = { ...header, '@odata.etag': 'W/"2"' };
    } else {
      const body = JSON.parse(String(init.body));
      if (path.includes('/hr_pettycashlineitems(')) {
        patches.push('line');
        assert.equal(headers.get('if-none-match'), '*');
        if (lines.has(path)) return new Response(null, { status: 412 });
        lines.set(path, body);
      } else if (body.pc_submissionstate === 0) {
        patches.push('draft');
        assert.equal(headers.get('if-none-match'), '*');
        assert.equal(body.hr_paymentsource, 123140001);
        assert.equal(body.hr_branch, branches.Lahore);
        assert.equal(body['transactioncurrencyid@odata.bind'], '/transactioncurrencies(' + currency + ')');
        header = { ...body, hr_pettycashrequestid: path.split('(')[1].slice(0, -1), _hr_submittedby_value: owner.id, '@odata.etag': 'W/"1"' };
      } else {
        patches.push('ready');
        assert.equal(headers.get('if-match'), 'W/"2"');
        assert.equal(uploaded, true);
        assert.equal(body.hr_workflowstage, 123140000);
        header = { ...header, ...body };
      }
    }
    return new Response(null, { status: 204 });
  });
  const from = async () => contact(owner);
  await assert.rejects(createLiveRequests(dv, from, currency, false).createRequest(owner, draft), /disabled/);
  assert.deepEqual(patches, []);
  const requests = createLiveRequests(dv, from, currency, true);
  await assert.rejects(requests.createRequest(owner, draft), error => error instanceof DataverseError && error.status === 500);
  assert.equal(header?.pc_submissionstate, 0);
  const id = await requests.createRequest(owner, draft);
  assert.equal(await requests.createRequest(owner, draft), id);
  assert.deepEqual(patches, ['draft', 'line', 'line', 'PDF', 'line', 'line', 'PDF', 'ready']);
  assert.deepEqual([...lines.values()].map(line => [line.hr_itemname, line.hr_unit, line.hr_quantity]), [['Paper', 'Pack', 1.25], ['Tape', 'Roll', 2]]);
  await assert.rejects(requests.createRequest(owner, { ...draft, purpose: 'changed' }), /original/);
  assert.equal(await requests.receiptFor(another.id, id), undefined);
  assert.equal((await requests.listRequests(another.id)).length, 0);
  assert.equal((await requests.listRequests(owner.id))[0].total, 8000);
  assert.deepEqual((await requests.receiptFor(owner.id, id))?.receipt, draft.pdf.bytes);
});

test('server forwards the authenticated Contact to the HTTP flows and enforces branch and ownership', async () => {
  const finance = profile('finance'), employee = profile('employee'), outsider = profile('employee', branches.Karachi);
  const questionId = randomUUID(), transactionId = randomUUID(), postingKey = randomUUID();
  const endpoints = {
    PC_FINANCE_FLOW_URL: 'https://test.api.powerplatform.com/finance',
    PC_CLARIFICATION_FLOW_URL: 'https://test.api.powerplatform.com/clarification'
  };
  const before = Object.fromEntries(Object.keys(endpoints).map(key => [key, process.env[key]]));
  Object.assign(process.env, endpoints);
  const calls: Record<string, unknown>[] = [];
  let confirmTransaction = true;
  const flow = createFlowClient(async () => 'flow-token', async (value, init) => {
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer flow-token');
    const payload = JSON.parse(String(init?.body));
    calls.push(payload);
    if (String(value) === endpoints.PC_FINANCE_FLOW_URL) {
      return Response.json({ status: 'posted', postingkey: postingKey, employeeid: employee.id,
        transactionid: confirmTransaction ? transactionId : undefined });
    }
    return Response.json({ status: 'answered', clarificationid: questionId });
  });
  const dv = createDataverse(apiOrigin, async () => 'dv-token', async value => {
    if (String(value).includes('/hr_requestclarifications(')) {
      return Response.json({ _hr_employee_value: employee.id, hr_requestclarificationid: questionId });
    }
    return Response.json({ value: [] });
  });
  const ctx = [finance, employee, outsider].map(contact);
  const workspace = createLiveWorkspace(dv, async id => ctx.find(row => row.contactid === id), flow);
  try {
    const movement = { employeeId: employee.id, type: 'cash_given' as const, amount: 8050, notes: 'Site advance', postingKey };
    await assert.rejects(workspace.postCash(employee, movement), /access/);
    await assert.rejects(workspace.postCash(finance, { ...movement, employeeId: finance.id }), /Another Finance/);
    await assert.rejects(workspace.postCash(finance, { ...movement, employeeId: outsider.id }), /your branch/);
    await assert.rejects(workspace.answerClarification(outsider, questionId, 'Other user'), /unavailable/);
    assert.equal(calls.length, 0);
    await workspace.postCash(finance, movement);
    await workspace.answerClarification(employee, questionId, 'Receipt is for site travel.');
    assert.deepEqual(calls, [
      { callerContactId: finance.id, employeeId: employee.id, movement: 'cash_given', amount: 80.5, notes: 'Site advance', postingKey },
      { callerContactId: employee.id, clarificationId: questionId, answer: 'Receipt is for site travel.' }
    ]);
    await assert.rejects(workspace.postCash(finance, { ...movement, postingKey: randomUUID() }), UnconfirmedError);
    confirmTransaction = false;
    await assert.rejects(workspace.postCash(finance, movement), UnconfirmedError);
    await assert.rejects(flow(endpoints.PC_FINANCE_FLOW_URL + '?sig=test', {}), /signature/);
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('demo password reset revokes old sessions and Finance retries retain one ledger row', async () => {
  const demo = makeDemoStore(':memory:');
  try {
    const employee = profile('employee'), finance = profile('finance');
    const code = demo.invite(employee);
    demo.invite(finance);
    assert.ok(code && await demo.activate(employee.email, code, 'first-password-example'));
    const session = await demo.signIn(employee.email, 'first-password-example');
    assert.ok(session && demo.sessionProfile(session.token));
    const reset = demo.issueReset(employee.email);
    assert.ok(reset && await demo.resetPassword(employee.email, reset, 'next-password-example'));
    assert.equal(await demo.resetPassword(employee.email, reset, 'third-password-example'), false);
    assert.equal(session && demo.sessionProfile(session.token), undefined);
    const movement = { postingKey: randomUUID(), employeeId: employee.id, type: 'cash_given' as const, amount: 10000, notes: 'Advance' };
    demo.postCash(finance, movement);
    demo.postCash(finance, movement);
    demo.postCash(finance, { ...movement, postingKey: randomUUID(), type: 'cash_returned', amount: 1250 });
    const rows = demo.activity(finance, employee.id);
    assert.equal(rows.length, 2);
    assert.equal(signedBalance(rows), 8750);
    assert.throws(() => demo.postCash(finance, { ...movement, amount: 20000 }), /different details/);
  } finally { demo.close(); }
});
