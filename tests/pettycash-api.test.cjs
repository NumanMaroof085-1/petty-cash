const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('pettycash-api.js', 'utf8');
const ids = {
  employee: '11111111-1111-4111-8111-111111111111',
  department: '22222222-2222-4222-8222-222222222222',
  manager: '33333333-3333-4333-8333-333333333333'
};
const schema = {
  hr_pettycashrequests: ['hr_pettycashrequestid', 'hr_requesttitle', 'hr_totalamount',
    'hr_purpose', 'hr_transactiondate', 'hr_paymentsource', 'hr_paymentmethod',
    'hr_approvalstatus', 'hr_erpsyncstatus',
    '_hr_submittedby_value', '_hr_department_value', '_hr_assignedmanager_value'],
  hr_pettycashlineitems: ['hr_pettycashlineitemid', 'hr_itemname', 'hr_quantity',
    'hr_unitprice', 'hr_totalprice', 'hr_category', 'hr_othercategory', '_hr_parentrequest_value']
};

function harness(options = {}) {
  const calls = [];
  const records = new Map();
  const messages = [];
  const liveSchema = structuredClone(schema);
  if (options.otherName) {
    liveSchema.hr_pettycashlineitems = liveSchema.hr_pettycashlineitems.map(name =>
      name === 'hr_othercategory' ? options.otherName : name);
  }
  const nodes = {};
  const values = {
    portalUserId: options.signedOut ? '' : ids.employee,
    portalUserName: 'Employee', portalUserEmail: 'employee@example.test',
    txtDate: '2026-10-08', selPaymentSource: 'Own Pocket',
    selPaymentMethod: 'Card / Online', selCategory: options.other ? 'Others' : 'Travel',
    txtOtherCategory: options.other ? 'Safety supplies' : '',
    txtJustification: 'Supplies for the office'
  };
  for (const [name, value] of Object.entries(values)) nodes[name] = { value, style: {} };
  nodes.btnSubmit = { innerHTML: 'Submit for Approval', style: {}, disabled: false };
  nodes.pcLoadingOverlay = { style: {} };
  nodes.pcLoadingText = { innerText: '' };
  nodes.pcAlertBox = {
    style: {}, scrollIntoView() {},
    replaceChildren(...children) { messages.push(children.map(c => c.textContent).join('')); }
  };
  nodes.otherCategoryGroup = { style: {} };
  nodes.filePreview = { innerHTML: '' };
  const receipt = options.receipt !== false ? {
    name: 'receipt.pdf', type: 'application/pdf', size: 4, lastModified: 123,
    async arrayBuffer() { return new ArrayBuffer(4); }
  } : null;
  nodes.fileReceipt = { value: '', files: receipt ? [receipt] : [] };
  const rows = (options.items || [
    { name: 'Printer paper', quantity: 2, unitPrice: 100 },
    { name: 'Pens', quantity: 3, unitPrice: 20 }
  ]).map(item => ({
    querySelector(selector) {
      return { '.name-input': { value: item.name }, '.qty-input': { value: String(item.quantity) },
        '.price-input': { value: String(item.unitPrice) }, '.row-total': { innerText: '' } }[selector];
    }
  }));
  nodes.tableBody = { innerHTML: '', appendChild() {} };
  nodes.lblGrandTotal = { innerText: '' };
  let sequence = 0;
  function response(status, data, id) {
    return {
      ok: status >= 200 && status < 300, status, statusText: status === 500 ? 'Internal Server Error' : 'Bad Request',
      headers: { get(name) { return name.toLowerCase() === 'entityid' ? id || null : null; } },
      async text() { return data === null ? '' : JSON.stringify(data); }
    };
  }
  function error(status, message, code = '0x80048d19') {
    return response(status, { error: { message, cdscode: code } });
  }
  const context = vm.createContext({
    window: {}, shell: { getTokenDeferred: async () => options.missingToken ? '' : 'csrf' },
    console: { log() {}, warn() {}, error() {} },
    document: {
      readyState: 'loading', addEventListener() {},
      getElementById(name) { return nodes[name] || null; },
      querySelector() { return null; }, querySelectorAll() { return rows; },
      createElement() { return { textContent: '', style: {} }; },
      createTextNode(text) { return { textContent: text }; }
    },
    async fetch(url, init) {
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      const call = { url, method: init.method, body, headers: init.headers };
      calls.push(call);
      if (options.intercept) {
        const intercepted = await options.intercept(call, { records, response, error });
        if (intercepted) return intercepted;
      }
      const uri = new URL(url, 'https://portal.example.test');
      const match = uri.pathname.match(/^\/_api\/(\w+)(?:\(([^)]+)\))?(?:\/(\w+))?$/);
      assert.ok(match, url);
      const [, set, id, column] = match;
      if (init.method === 'PUT') {
        assert.equal(column, 'hr_receiptimage');
        return response(204, null);
      }
      if (init.method === 'GET' && set === 'contacts') {
        if (options.delayProfile && id === ids.employee) await options.delayProfile;
        return response(200, id === ids.employee ? {
          contactid: id, _hr_department_value: options.noDepartment ? null : ids.department,
          _hr_reportstomanager_value: options.noManager ? null : ids.manager
        } : { contactid: id });
      }
      if (init.method === 'GET' && set === 'hr_departmentses') {
        assert.equal(uri.searchParams.get('$select'), 'hr_departmentname',
          'Read the confirmed name column; do not guess the GUID primary-key column');
        return response(200, { hr_departmentname: 'Operations' });
      }
      if (init.method === 'GET') {
        if (!liveSchema[set]) return error(404, 'Unknown entity set ' + set);
        const columns = (uri.searchParams.get('$select') || '').split(',');
        const unknown = columns.find(name => !liveSchema[set].includes(name) || name === options.missingColumn);
        if (unknown) return error(400, 'Could not find property ' + unknown);
        if (!id) return response(200, { value: [] });
        const record = records.get(id);
        assert.ok(record, 'The record must exist before it is read');
        const data = { ...record };
        if (options.omittedHeaderField && set === 'hr_pettycashrequests') delete data[options.omittedHeaderField];
        if (options.omittedLineField && set === 'hr_pettycashlineitems') delete data[options.omittedLineField];
        return response(200, data);
      }
      assert.equal(init.method, 'POST');
      const navigation = set === 'hr_pettycashrequests' ? {
        hr_SubmittedBy: '_hr_submittedby_value', [options.departmentNavigation || 'hr_Department']: '_hr_department_value',
        hr_AssignedManager: '_hr_assignedmanager_value'
      } : { hr_ParentRequest: '_hr_parentrequest_value' };
      const record = {};
      for (const [name, value] of Object.entries(body)) {
        if (name.endsWith('@odata.bind')) {
          const nav = name.replace('@odata.bind', '');
          assert.ok(navigation[nav], 'Use the exact configured relationship');
          if (navigation[nav] === '_hr_department_value') {
            assert.equal(value, '/hr_departmentses(' + ids.department + ')',
              'Department binds to the confirmed entity set, not a guessed plural');
          }
          record[navigation[nav]] = value.match(/\(([^)]+)\)/)[1];
        } else {
          assert.ok(liveSchema[set].includes(name), 'Write only writable known columns: ' + name);
          record[name] = value;
        }
      }
      const newId = '44444444-4444-4444-8444-' + String(++sequence).padStart(12, '0');
      record[set === 'hr_pettycashrequests' ? 'hr_pettycashrequestid' : 'hr_pettycashlineitemid'] = newId;
      records.set(newId, record);
      return response(204, null, newId);
    }
  });
  context.window.parent = context.window;
  const selection = { key: receipt ? 'receipt-1' : '', files: receipt ? [receipt] : [] };
  const preparationCalls = [];
  const locks = [];
  if (!options.missingReceiptTools) context.window.PettyCashReceipts = { current: {
    snapshot() { return selection; },
    async prepare(snapshot, settings) {
      preparationCalls.push({ snapshot, settings, writes: calls.filter(call => call.method !== 'GET').length });
      if (options.prepareReceipt) return options.prepareReceipt(snapshot, settings);
      return receipt;
    },
    setLocked(value) { locks.push(value); }, reset() {}
  } };
  vm.runInContext(source, context);
  return { context, calls, records, messages, nodes, selection, preparationCalls, locks, evaluate: code => vm.runInContext(code, context),
    submit: () => vm.runInContext('submitPettyCashRequest()', context) };
}

test('complete request retains every field, binds all lookups, and verifies children before success', async () => {
  const h = harness({ other: true, receipt: true });
  await h.submit();
  const writes = h.calls.filter(c => c.method === 'POST');
  assert.equal(writes.length, 3);
  const header = writes[0].body;
  assert.ok(!('hr_othercategory' in header), 'Other Category does not exist on the header table');
  assert.equal(header.hr_totalamount, 260);
  assert.equal(header.hr_paymentmethod, 123140001);
  assert.equal(header.hr_paymentsource, 123140001);
  assert.equal(header.hr_approvalstatus, 123140000);
  assert.equal(header.hr_erpsyncstatus, 123140000);
  assert.equal(header['hr_Department@odata.bind'], '/hr_departmentses(' + ids.department + ')');
  assert.ok(header['hr_SubmittedBy@odata.bind']);
  assert.ok(header['hr_AssignedManager@odata.bind']);
  for (const write of writes.slice(1)) {
    assert.equal(write.body.hr_category, 123140005);
    assert.equal(write.body.hr_othercategory, 'Safety supplies');
    assert.equal(write.body.hr_totalprice, Number((write.body.hr_quantity * write.body.hr_unitprice).toFixed(2)));
  }
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 1);
  assert.match(h.messages.at(-1), /Success!/);
  for (const call of h.calls) assert.equal(call.headers.__RequestVerificationToken, 'csrf');
});

test('a complete save reads only the employee Contact while retaining and verifying the manager binding', async () => {
  const h = harness({ other: true, intercept(call, { error }) {
    if (call.method === 'GET' && call.url.startsWith('/_api/contacts(') &&
        !call.url.startsWith('/_api/contacts(' + ids.employee + ')')) {
      return error(403, 'Other Contact reads are forbidden');
    }
  } });
  await h.submit();
  const contactReads = h.calls.filter(c => c.method === 'GET' && c.url.startsWith('/_api/contacts('));
  assert.equal(contactReads.length, 1);
  assert.ok(contactReads.every(c => c.url.startsWith('/_api/contacts(' + ids.employee + ')')));
  const header = h.calls.find(c => c.method === 'POST').body;
  assert.equal(header['hr_AssignedManager@odata.bind'], '/contacts(' + ids.manager + ')');
  assert.ok(h.calls.some(c => c.method === 'GET' && c.url.includes('hr_pettycashrequests(') &&
    c.url.includes('_hr_assignedmanager_value')));
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 1);
  assert.match(h.messages.at(-1), /Success!/);
});

test('a missing manager on the employee profile still blocks all request writes', async () => {
  const h = harness({ noManager: true });
  await h.submit();
  assert.ok(h.calls.every(c => c.method === 'GET'));
  assert.match(h.messages.at(-1), /no assigned manager/);
});

test('Contact association 403 retains every bind and permits a full retry after definite rejection', async () => {
  let permissionFixed = false;
  const h = harness({ other: true, intercept(call, { error }) {
    if (!permissionFixed && call.method === 'POST' && call.url === '/_api/hr_pettycashrequests') {
      return error(403, 'You do not have permission to associate or disassociate table contact to hr_pettycashrequest');
    }
  } });
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 1);
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 0);
  assert.equal(h.context.window.pettyCashDiagnostics.pendingRequest, null);
  assert.match(h.messages.at(-1), /no reduced request was sent/);
  permissionFixed = true;
  await h.submit();
  const headers = h.calls.filter(c => c.method === 'POST' && c.url === '/_api/hr_pettycashrequests');
  assert.equal(headers.length, 2);
  for (const { body } of headers) {
    assert.equal(body['hr_SubmittedBy@odata.bind'], '/contacts(' + ids.employee + ')');
    assert.equal(body['hr_AssignedManager@odata.bind'], '/contacts(' + ids.manager + ')');
    assert.equal(body['hr_Department@odata.bind'], '/hr_departmentses(' + ids.department + ')');
  }
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 4);
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 1);
  assert.match(h.messages.at(-1), /Success!/);
});

test('500 on Department binding causes one full POST and never a reduced success', async () => {
  const h = harness({ intercept(call, { error }) {
    if (call.method === 'POST') return error(500, 'An unexpected error occurred');
  } });
  await h.submit();
  await h.submit();
  const posts = h.calls.filter(c => c.method === 'POST');
  assert.equal(posts.length, 1);
  assert.ok(posts[0].body['hr_Department@odata.bind']);
  assert.ok(posts[0].body.hr_paymentmethod);
  assert.ok(h.messages.every(m => !m.includes('Success!')));
  assert.equal(h.context.window.pettyCashDiagnostics.pendingRequest.uncertain, true);
});

test('the old Department entity set is rejected before creating a request', async () => {
  const h = harness();
  h.evaluate('DATAVERSE_CONFIG.entitySets.departments = "hr_departments";');
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 0);
  assert.match(h.messages.at(-1), /Unknown entity set hr_departments/);
});

test('Department field settings use the table logical name and confirmed name column', async () => {
  const h = harness();
  const settings = h.context.window.pettyCashDiagnostics.siteSettings;
  assert.equal(settings.find(s => s.name === 'Webapi/hr_departments/enabled').value, 'true');
  assert.equal(settings.find(s => s.name === 'Webapi/hr_departments/fields').value, 'hr_departmentname');
  assert.ok(!settings.some(s => s.name.startsWith('Webapi/hr_department/')));
  const report = await h.context.window.pettyCashDiagnostics.checkSetup();
  assert.ok(report.checks.find(check => check.name === 'department target').ok);
  assert.ok(h.calls.every(call => call.method === 'GET'));
});

test('unrecognized Other Category is identified by reads before any POST', async () => {
  const h = harness({ other: true, missingColumn: 'hr_othercategory' });
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 0);
  assert.match(h.messages.at(-1), /hr_othercategory/);
  assert.match(h.messages.at(-1), /No request was created/);
});

test('choice rejection does not retry without payment or status fields', async () => {
  const h = harness({ intercept(call, { error }) {
    if (call.method === 'POST') return error(400, 'Picklist value is out of range', '0x8004431a');
  } });
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 1);
  assert.match(h.messages.at(-1), /Picklist value/);
  assert.equal(h.context.window.pettyCashDiagnostics.pendingRequest, null);
});

test('lost Department on read-back stops submission before children or success', async () => {
  const h = harness({ omittedHeaderField: '_hr_department_value' });
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 1);
  assert.match(h.messages.at(-1), /hr_department/);
  assert.ok(!h.messages.at(-1).includes('Success!'));
});

test('submit waits for the employee profile and overlapping clicks produce one request', async () => {
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  const h = harness({ delayProfile: ready });
  const first = h.submit();
  await Promise.resolve();
  const second = h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 0);
  release();
  await Promise.all([first, second]);
  assert.equal(h.calls.filter(c => c.method === 'POST' && c.url.endsWith('hr_pettycashrequests')).length, 1);
});

test('missing department, missing identity, or missing CSRF prevents writes', async () => {
  for (const options of [{ noDepartment: true }, { signedOut: true }, { missingToken: true }]) {
    const h = harness(options);
    await h.submit();
    assert.equal(h.calls.filter(c => c.method === 'POST').length, 0);
    assert.ok(h.messages.at(-1).includes('Error:'));
  }
});

test('known child rejection can resume without creating another header or duplicating confirmed children', async () => {
  let rejected = false;
  const h = harness({ intercept(call, { error }) {
    if (!rejected && call.method === 'POST' && call.body.hr_itemname === 'Pens') {
      rejected = true;
      return error(400, 'Product rejected');
    }
  } });
  await h.submit();
  assert.match(h.messages.at(-1), /resume/);
  await h.submit();
  const posts = h.calls.filter(c => c.method === 'POST');
  assert.equal(posts.filter(c => c.body.hr_requesttitle).length, 1);
  assert.equal(posts.filter(c => c.body.hr_itemname === 'Printer paper').length, 1);
  assert.equal(h.records.size, 3);
  assert.match(h.messages.at(-1), /Success!/);
});

test('ambiguous product save is never automatically retried', async () => {
  const h = harness({ intercept(call, { error }) {
    if (call.method === 'POST' && call.body.hr_itemname === 'Pens') return error(503, 'Service unavailable');
  } });
  await h.submit();
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST' && c.body.hr_itemname === 'Pens').length, 1);
  assert.equal(h.context.window.pettyCashDiagnostics.pendingRequest.uncertain, true);
});

test('receipt failure remains an error and retries only the receipt for the same request', async () => {
  let failed = false;
  const h = harness({ receipt: true, intercept(call, { error }) {
    if (!failed && call.method === 'PUT') { failed = true; return error(500, 'Upload failed'); }
  } });
  await h.submit();
  assert.match(h.messages.at(-1), /uploading the receipt/);
  assert.ok(!h.messages.at(-1).includes('Success!'));
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 3);
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 2);
  assert.match(h.messages.at(-1), /Success!/);
});

test('mandatory receipt blocks submission before API calls or record creation', async () => {
  const h = harness({ receipt: false });
  await h.submit();
  assert.match(h.messages.at(-1), /Please attach a receipt/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.records.size, 0);
  assert.equal(h.context.window.pettyCashDiagnostics.pendingRequest, null);
  assert.equal(h.nodes.btnSubmit.disabled, false);
});

test('required receipt is uploaded before success for standard categories too', async () => {
  const h = harness();
  await h.submit();
  assert.equal(h.calls.at(-1).method, 'PUT');
  assert.match(h.calls.at(-1).url, /hr_receiptimage/);
  assert.match(h.messages.at(-1), /including the receipt/);
  assert.match(h.messages.at(-1), /Success!/);
});

test('receipt input is marked required in the HTML', () => {
  const html = fs.readFileSync('New Petty Cash Request.html', 'utf8');
  assert.match(html, /<input[^>]*id="fileReceipt"[^>]*\brequired\b/);
});

test('receipt tools are required and never fall back to silently uploading the first selected image', async () => {
  const h = harness({ missingReceiptTools: true });
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.match(h.messages.at(-1), /receipt tools are not installed/);
});

test('failed PDF preparation stops before any API request and permits selection edits', async () => {
  const h = harness({ prepareReceipt() { throw new Error('Image could not be decoded'); } });
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.equal(h.records.size, 0);
  assert.match(h.messages.at(-1), /preparing the receipt PDF/);
  assert.equal(h.locks.at(-1), false);
});
test('expense edits made while preparing a receipt prevent a stale form submission', async () => {
  let h;
  h = harness({ prepareReceipt() {
    h.nodes.txtJustification.value = 'Changed during conversion';
    return { type: 'application/pdf', size: 20 };
  } });
  await h.submit();
  assert.equal(h.calls.length, 0);
  assert.match(h.messages.at(-1), /form changed while the receipt/);
  assert.equal(h.locks.at(-1), false);
});

test('prepared PDF validation rejects an oversized or non-PDF result before saving', async () => {
  for (const prepared of [{ type: 'image/jpeg', size: 100 }, { type: 'application/pdf', size: 11 * 1024 * 1024 }]) {
    const h = harness({ prepareReceipt() { return prepared; } });
    await h.submit();
    assert.equal(h.calls.length, 0);
    assert.match(h.messages.at(-1), /prepared receipt must be a PDF/);
  }
});

test('receipt is prepared before writes; retry retains saved records and the exact original PDF bytes', async () => {
  let uploads = 0, prepared = 0;
  const first = new ArrayBuffer(7), second = new ArrayBuffer(9);
  const h = harness({ prepareReceipt() {
    const bytes = prepared++ === 0 ? first : second;
    return { type: 'application/pdf', name: 'receipts.pdf', size: bytes.byteLength, async arrayBuffer() { return bytes; } };
  }, intercept(call, { error }) {
    if (call.method === 'PUT' && uploads++ === 0) return error(500, 'Upload interrupted');
  } });
  await h.submit();
  assert.equal(h.preparationCalls[0].writes, 0);
  assert.equal(h.locks.at(-1), true, 'Partial saves keep selection locked');
  await h.submit();
  const puts = h.calls.filter(call => call.method === 'PUT');
  assert.equal(puts.length, 2);
  assert.equal(puts[0].body, first);
  assert.equal(puts[1].body, first, 'Use retained state PDF even if a helper incorrectly returns a new object');
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 3);
  assert.equal(h.locks.at(-1), false);
});

test('changing image selection/order after a partial save blocks another preparation or write', async () => {
  const h = harness({ intercept(call, { error }) { if (call.method === 'PUT') return error(500, 'Upload interrupted'); } });
  await h.submit();
  h.selection.key = 'changed-image-order';
  const before = h.calls.length;
  await h.submit();
  assert.equal(h.calls.length, before);
  assert.equal(h.preparationCalls.length, 1);
  assert.match(h.messages.at(-1), /Restore its original form values/);
});

for (const scenario of [
  { name: 'missing manager', options: { noManager: true }, amount: -260, blockedBy: /no assigned manager/ },
  { name: 'missing department', options: { noDepartment: true }, amount: 1250, blockedBy: /no department/ },
  { name: 'both lookups missing', options: { noManager: true, noDepartment: true }, amount: 0, blockedBy: /no department/ },
  { name: 'Contact read denied', options: { intercept(call, { error }) {
    if (call.url.startsWith('/_api/contacts(')) return error(403, 'Contact profile read denied');
  } }, amount: 80, blockedBy: /Contact profile read denied/ }
]) {
  test('own balance works with ' + scenario.name + ' but submission still validates the profile', async () => {
    const h = harness(scenario.options);
    h.nodes.pcEmployeeBalanceValue = { textContent: '' };
    h.nodes.pcEmployeeBalanceMeaning = { textContent: '' };
    h.nodes.pcEmployeeBalanceRefresh = { disabled: false };
    const ledgerReads = [];
    h.context.window.PettyCashModules = {
      async readBalance(id) { ledgerReads.push(id); return scenario.amount; },
      money(amount) { return amount.toFixed(2) + ' PKR'; },
      balanceMeaning(amount) { return amount < 0 ? 'Company owes you' : amount > 0 ? 'Company cash held' : 'Settled'; }
    };
    await h.evaluate('refreshEmployeeBalance();');
    assert.deepEqual(ledgerReads, [ids.employee], 'Read only the signed-in employee ledger');
    assert.equal(h.calls.length, 0, 'Balance must not depend on Contact profile API reads');
    assert.equal(h.nodes.pcEmployeeBalanceValue.textContent, scenario.amount.toFixed(2) + ' PKR');
    assert.equal(h.nodes.pcEmployeeBalanceMeaning.textContent,
      scenario.amount < 0 ? 'Company owes you' : scenario.amount > 0 ? 'Company cash held' : 'Settled');
    assert.equal(h.nodes.pcEmployeeBalanceRefresh.disabled, false);
    await h.submit();
    assert.equal(h.calls.filter(call => call.method !== 'GET').length, 0,
      'An incomplete/inaccessible submission profile still blocks every request write');
    assert.match(h.messages.at(-1), scenario.blockedBy);
  });
}

for (const identity of ['', 'id', '{{ user.id }}']) {
  test('balance rejects a missing or invalid signed-in identity: ' + JSON.stringify(identity), async () => {
    const h = harness();
    h.nodes.portalUserId.value = identity;
    h.nodes.pcEmployeeBalanceValue = { textContent: '' };
    h.nodes.pcEmployeeBalanceMeaning = { textContent: '' };
    h.nodes.pcEmployeeBalanceRefresh = { disabled: false };
    h.context.window.PettyCashModules = { async readBalance() { assert.fail('Do not read a ledger without identity'); } };
    await h.evaluate('refreshEmployeeBalance();');
    assert.equal(h.nodes.pcEmployeeBalanceValue.textContent, 'Unavailable');
    assert.equal(h.nodes.pcEmployeeBalanceMeaning.textContent, 'Please sign in to view your cash balance.');
    assert.equal(h.nodes.pcEmployeeBalanceRefresh.disabled, false);
    assert.equal(h.calls.length, 0);
  });
}

test('balance widget failures remain read-only and do not break expense submission', async () => {
  const h = harness();
  h.nodes.pcEmployeeBalanceValue = { textContent: '' };
  h.nodes.pcEmployeeBalanceMeaning = { textContent: '' };
  h.nodes.pcEmployeeBalanceRefresh = { disabled: false };
  h.context.window.PettyCashModules = { async readBalance() { throw new Error('Cash ledger permission missing'); } };
  await h.evaluate('refreshEmployeeBalance();');
  assert.equal(h.nodes.pcEmployeeBalanceValue.textContent, 'Unavailable');
  assert.match(h.nodes.pcEmployeeBalanceMeaning.textContent, /permission missing/);
  assert.equal(h.calls.length, 0, 'A failed ledger read must not trigger Contact reads or writes');
  assert.equal(h.nodes.pcEmployeeBalanceRefresh.disabled, false);
  await h.submit();
  assert.match(h.messages.at(-1), /Success!/);
});

test('editing a partial request blocks creation of a second header', async () => {
  const h = harness({ omittedHeaderField: '_hr_department_value' });
  await h.submit();
  h.nodes.txtJustification.value = 'Changed details';
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 1);
  assert.match(h.messages.at(-1), /original form values/);
});

test('setup diagnostics perform reads only and expose a failing Other Category name', async () => {
  const h = harness({ missingColumn: 'hr_othercategory' });
  const result = await h.context.window.pettyCashDiagnostics.checkSetup();
  assert.ok(result.checks.some(check => !check.ok && check.columns.some(c => c.column === 'hr_othercategory')));
  assert.equal(result.checks[0].ok, true, 'The header must not query the line-only column');
  assert.equal(result.checks[1].ok, false);
  assert.ok(h.calls.every(c => c.method === 'GET'));
  assert.equal(h.context.window.pettyCashDiagnostics.lastSetupReport, result);
  assert.ok(result.checks.find(check => !check.ok).columns[0].details);
});

test('nested API error is preserved and rendered as plain text', async () => {
  const h = harness({ intercept(call, { response }) {
    if (call.method === 'POST') return response(400, { error: {
      message: 'Common Data Service error', cdscode: '0x80048d19',
      innererror: { message: 'Unknown property <hr_othercategory>' }
    } });
  } });
  await h.submit();
  assert.match(h.messages.at(-1), /Unknown property <hr_othercategory>/);
  assert.equal(h.context.window.pettyCashDiagnostics.lastFailure.code, '0x80048d19');
});

test('diagnostics retain capitalized Dataverse details and the inner error code', async () => {
  const h = harness({ intercept(call, { response }) {
    if (call.method === 'GET' && call.url.includes('$select=') &&
        call.url.split('$select=')[1].split(',').includes('hr_othercategory')) {
      return response(400, { error: {
        code: '9004010A', message: 'An unexpected error occurred',
        innererror: { code: '0x80048d19', cdserrordetails: {
          Message: 'Column hr_othercategory is not available',
          innerexception: { message: { value: 'Publish the column metadata' } }
        } }
      } });
    }
  } });
  const report = await h.context.window.pettyCashDiagnostics.checkSetup();
  const failure = report.checks[1].columns[0];
  assert.equal(failure.column, 'hr_othercategory');
  assert.equal(failure.code, '0x80048d19');
  assert.match(failure.message, /Column hr_othercategory is not available/);
  assert.match(failure.message, /Publish the column metadata/);
  assert.equal(failure.details.code, '9004010A');
  assert.equal(report.checks[0].ok, true);
  assert.equal(report.checks[2].ok, true);
  assert.ok(h.calls.every(c => c.method === 'GET'));
});

test('Dataverse cdscode takes precedence over nested wrapper codes', async () => {
  const h = harness({ intercept(call, { response }) {
    if (call.method === 'POST') return response(400, { error: {
      code: '9004010D', cdscode: '0x80048d19', message: 'Dataverse rejected the request',
      innererror: { code: 'WrapperError', message: 'Unknown column' }
    } });
  } });
  await h.submit();
  assert.equal(h.context.window.pettyCashDiagnostics.lastFailure.code, '0x80048d19');
});

test('embedded HTML script matches the standalone script', () => {
  const html = fs.readFileSync('New Petty Cash Request.html', 'utf8');
  const embedded = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.equal(embedded.replace(/\r\n/g, '\n').trim(), source.replace(/\r\n/g, '\n').trim());
  new vm.Script(embedded);
});

test('confirmed environment mappings change both the payload and the explicit field settings', async () => {
  const h = harness({ other: true, otherName: 'hr_othercategorydetails', departmentNavigation: 'hr_DepartmentLookup' });
  h.evaluate('DATAVERSE_CONFIG.columns.lineItems.otherCategory = "hr_othercategorydetails"; DATAVERSE_CONFIG.navigationProperties.department = "hr_DepartmentLookup";');
  await h.submit();
  const post = h.calls.find(c => c.method === 'POST');
  assert.ok(!('hr_othercategorydetails' in post.body));
  assert.ok(!('hr_othercategory' in post.body));
  for (const line of h.calls.filter(c => c.method === 'POST' && c.body.hr_itemname)) {
    assert.equal(line.body.hr_othercategorydetails, 'Safety supplies');
    assert.ok(!('hr_othercategory' in line.body));
  }
  assert.ok(post.body['hr_DepartmentLookup@odata.bind']);
  assert.ok(!('hr_Department@odata.bind' in post.body));
  const settings = h.context.window.pettyCashDiagnostics.siteSettings;
  const fields = settings.find(setting => setting.name === 'Webapi/hr_pettycashrequest/fields').value.split(',');
  assert.ok(!fields.includes('hr_othercategorydetails'));
  const lineFields = settings.find(setting => setting.name === 'Webapi/hr_pettycashlineitem/fields').value.split(',');
  assert.ok(lineFields.includes('hr_othercategorydetails'));
  assert.ok(lineFields.includes('hr_totalprice'));
  assert.ok(!lineFields.includes('hr_othercategory'));
  assert.ok(fields.includes('hr_DepartmentLookup'));
  assert.ok(fields.includes('_hr_department_value'));
  assert.ok(!fields.includes('*'));
  assert.match(h.messages.at(-1), /Success!/);
});

test('standard categories omit Other Category even when hidden text is left over', async () => {
  const h = harness();
  h.nodes.txtOtherCategory.value = 'Old category text';
  await h.submit();
  assert.ok(h.calls.filter(c => c.method === 'POST').every(c => !('hr_othercategory' in c.body)));
  assert.match(h.messages.at(-1), /Success!/);
});

test('simple currency totals are saved and verified on every standard-category item', async () => {
  const h = harness();
  await h.submit();
  const linePosts = h.calls.filter(c => c.method === 'POST' && c.body.hr_itemname);
  assert.deepEqual(linePosts.map(c => c.body.hr_totalprice), [200, 60]);
  const saved = [...h.records.values()].filter(record => record.hr_itemname);
  assert.deepEqual(saved.map(record => record.hr_totalprice), [200, 60]);
  assert.ok(h.calls.filter(c => c.method === 'GET' && /hr_pettycashlineitems\(/.test(c.url))
    .every(c => c.url.includes('hr_totalprice')));
  assert.match(h.messages.at(-1), /Success!/);
});

test('rounded line totals, displayed grand total, and saved header total agree', async () => {
  const h = harness({ items: [
    { name: 'First item', quantity: 1, unitPrice: 0.335 },
    { name: 'Second item', quantity: 1, unitPrice: 0.335 }
  ] });
  h.evaluate('calculateTotals();');
  assert.equal(h.nodes.lblGrandTotal.innerText, '0.68');
  await h.submit();
  const posts = h.calls.filter(c => c.method === 'POST');
  assert.equal(posts[0].body.hr_totalamount, 0.68);
  assert.deepEqual(posts.slice(1).map(c => c.body.hr_totalprice), [0.34, 0.34]);
  assert.match(h.messages.at(-1), /Success!/);
});

test('missing Total Price field exposure blocks saves before creating the header', async () => {
  const h = harness({ missingColumn: 'hr_totalprice' });
  await h.submit();
  assert.match(h.messages.at(-1), /hr_totalprice/);
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 0);
});

test('lost item total on read-back stops success and avoids recreating saved records', async () => {
  const h = harness({ omittedLineField: 'hr_totalprice' });
  await h.submit();
  assert.match(h.messages.at(-1), /hr_totalprice/);
  assert.ok(!h.messages.at(-1).includes('Success!'));
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 2);
  assert.equal(h.calls.filter(c => c.method === 'PUT').length, 0);
});

test('line-only Other Category is exposed and all setup checks pass without a header column', async () => {
  const h = harness();
  const diagnostics = h.context.window.pettyCashDiagnostics;
  const report = await diagnostics.checkSetup();
  assert.ok(report.checks.every(check => check.ok));
  assert.ok(h.calls.every(c => c.method === 'GET'));
  const settings = diagnostics.siteSettings;
  assert.ok(!settings.find(s => s.name === 'Webapi/hr_pettycashrequest/fields').value.split(',').includes('hr_othercategory'));
  assert.ok(settings.find(s => s.name === 'Webapi/hr_pettycashlineitem/fields').value.split(',').includes('hr_othercategory'));
  assert.ok(h.calls.filter(c => c.url.startsWith('/_api/hr_pettycashrequests')).every(c => !c.url.includes('hr_othercategory')));
  assert.ok(h.calls.some(c => c.url.startsWith('/_api/hr_pettycashlineitems') && c.url.includes('hr_othercategory')));
});

test('lost Other Category on a saved line prevents success and does not duplicate that line on retry', async () => {
  const h = harness({ other: true, omittedLineField: 'hr_othercategory' });
  await h.submit();
  assert.match(h.messages.at(-1), /hr_othercategory/);
  assert.ok(!h.messages.at(-1).includes('Success!'));
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST').length, 2, 'One header and one saved line only');
});

test('resuming an Others request retains details on every line without duplicating the header', async () => {
  let rejected = false;
  const h = harness({ other: true, intercept(call, { error }) {
    if (!rejected && call.method === 'POST' && call.body.hr_itemname === 'Pens') {
      rejected = true;
      return error(400, 'Product rejected');
    }
  } });
  await h.submit();
  await h.submit();
  assert.equal(h.calls.filter(c => c.method === 'POST' && c.body.hr_requesttitle).length, 1);
  const lines = [...h.records.values()].filter(record => record.hr_itemname);
  assert.equal(lines.length, 2);
  assert.ok(lines.every(record => record.hr_othercategory === 'Safety supplies'));
  assert.match(h.messages.at(-1), /Success!/);
});
