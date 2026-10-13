const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('pettycash-modules.js', 'utf8');
const employee = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const flow = '33333333-3333-4333-8333-333333333333';
const transaction = '44444444-4444-4444-8444-444444444444';
test('all three pages include the shared Web Template once without requesting the blocked Web File', () => {
  const include = "{% include 'Petty Cash Modules' %}";
  for (const file of ['New Petty Cash Request.html', 'My Petty Cash Requests.html', 'Accounts Cash Management.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(html.split(include).length - 1, 1, file);
    const contextInclude = "{% include 'Petty Cash User Context' %}";
    assert.equal(html.split(contextInclude).length - 1, 1, file);
    assert.ok(html.indexOf(contextInclude) < html.indexOf(include), 'Identity is rendered before helpers initialize: ' + file);
    assert.doesNotMatch(html, /\{\{\s*user\.|id=["'](?:portalUserId|pcModuleUserId|pcAccountsAllowed)["']/i,
      'Do not duplicate user-context fields in editable page HTML: ' + file);
    assert.doesNotMatch(html, /<script\b[^>]*src=["']\/pettycash-modules\.js["']/i, file);
    if (file === 'New Petty Cash Request.html') {
      assert.ok(html.indexOf(include) < html.indexOf('<script>'), 'Shared helpers load before submission script');
    }
  }
  // Liquid parses template content before the browser parses its script element.
  assert.doesNotMatch(script, /<\/script|\{%|\{\{/i);
  new vm.Script(script);
});
test('the shared user-context template preserves input IDs, escapes values, and checks the Accounts role', () => {
  const source = fs.readFileSync('Petty Cash User Context.html', 'utf8');
  for (const id of ['portalUserId', 'portalUserName', 'portalUserEmail', 'pcModuleUserId', 'pcAccountsAllowed']) {
    assert.equal(source.split('id="' + id + '"').length - 1, 1, id);
  }
  assert.match(source, /id="portalUserId" value="\{\{ user\.id \| escape \}\}"/);
  assert.match(source, /id="pcModuleUserId" value="\{\{ user\.id \| escape \}\}"/);
  assert.match(source, /user\.fullname \| escape/);
  assert.match(source, /user\.emailaddress1 \| escape/);
  assert.match(source, /user\.roles contains 'Petty Cash Accounts' %\}true\{% else %\}false/);
  assert.doesNotMatch(source, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    'Never hardcode an employee GUID');
});
function harness({ config = {}, fetcher, missingToken = false } = {}) {
  const calls = [];
  const root = { location: { origin: 'https://portal.example.test' }, PC_MODULE_CONFIG: config,
    shell: { async getTokenDeferred() { return missingToken ? '' : 'token'; } },
    crypto: { randomUUID() { return transaction; } },
    document: { readyState: 'loading', addEventListener() {} },
    async fetch(url, options) {
      calls.push({ url, ...options });
      const result = fetcher ? await fetcher(url, options, calls.length) : { status: 200, body: { value: [] } };
      return { status: result.status, ok: result.status >= 200 && result.status < 300,
        async text() { return result.body === null ? '' : JSON.stringify(result.body); } };
    }
  };
  vm.runInNewContext(script, { window: root, URL, URLSearchParams, Intl, Number, Object, Array, Set, Promise });
  return { api: root.PettyCashModules, calls };
}
function row(type, amount, request = null) {
  return { hr_transactiontype: type, hr_amount: amount, _hr_employee_value: employee, _hr_linkedrequest_value: request };
}
test('an empty ledger starts at zero and confirmed transaction types have the correct signs', () => {
  const h = harness();
  assert.equal(h.api.sumTransactions([]), 0);
  assert.equal(h.api.sumTransactions([row(123140000, 1000), row(123140001, 1200, other), row(123140002, 100)]), -300);
  assert.equal(h.api.sumTransactions([row(123140001, 1000, other), row(123140000, 1000)]), 0);
});
test('ledger rejects negative amounts, unknown types, and duplicate expense deductions', () => {
  const h = harness();
  assert.throws(() => h.api.sumTransactions([row(123140000, -1)]), /invalid amount/);
  assert.throws(() => h.api.sumTransactions([row(99, 10)]), /unknown transaction/);
  assert.throws(() => h.api.sumTransactions([row(123140001, 10, other), row(123140001, 10, other)]), /twice/);
});
test('balance reads the entire employee-filtered ledger including later pages', async () => {
  const h = harness({ fetcher(url, options, count) {
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.__RequestVerificationToken, 'token');
    assert.ok(url.includes('hr_cashtransactions'));
    return { status: 200, body: count === 1 ? { value: [row(123140000, 1000)],
      '@odata.nextLink': '/_api/hr_cashtransactions?$skiptoken=page2' } : { value: [row(123140001, 1200, other)] } };
  } });
  assert.equal(await h.api.readBalance(employee), -200);
  assert.match(decodeURIComponent(h.calls[0].url), new RegExp('_hr_employee_value eq ' + employee));
  assert.equal(h.calls.length, 2);
});
test('employee IDs and every ledger row are checked before displaying a balance', async () => {
  const h = harness({ fetcher() { return { status: 200, body: { value: [{ ...row(123140000, 100), _hr_employee_value: other }] } }; } });
  await assert.rejects(h.api.readBalance('not-a-guid'), /valid employee/);
  assert.equal(h.calls.length, 0);
  await assert.rejects(h.api.readBalance(employee), /Another employee/);
});
test('foreign-origin pagination cannot send tokens or reveal partial results', async () => {
  const h = harness({ fetcher() { return { status: 200, body: { value: [], '@odata.nextLink': 'https://evil.example/_api/hr_cashtransactions' } }; } });
  await assert.rejects(h.api.readBalance(employee), /Unexpected paging/);
  assert.equal(h.calls.length, 1);
});
test('My Requests uses the submitting employee filter and rejects another employee record', async () => {
  const h = harness({ fetcher() { return { status: 200, body: { value: [{ _hr_submittedby_value: other }] } }; } });
  await assert.rejects(h.api.myRequests(employee), /Another employee/);
  assert.match(decodeURIComponent(h.calls[0].url), new RegExp('_hr_submittedby_value eq ' + employee));
  assert.ok(h.calls.every(call => call.method === 'GET'));
});
test('a missing Contact balance column is not silently displayed as zero', async () => {
  const h = harness({ fetcher() { return { status: 200, body: { contactid: employee } }; } });
  await assert.rejects(h.api.readSavedBalance(employee), /not returned/);
});
test('cash posting is disabled by default and accepts only given or returned cash', async () => {
  const h = harness();
  assert.equal(h.api.flowReady(), false);
  await assert.rejects(h.api.postMovement({}), /disabled/);
  assert.equal(h.calls.length, 0);
  assert.throws(() => h.api.validateMovement({ employeeId: employee, movement: 'expense_approved', amount: 10, notes: 'test' }), /Choose cash/);
  for (const amount of [-1, 0, NaN, 1.001]) {
    assert.throws(() => h.api.validateMovement({ employeeId: employee, movement: 'cash_given', amount, notes: 'test' }), /positive amount/);
  }
});
test('accounts flow uses site-authenticated eventData transport, not direct ledger or balance writes', async () => {
  const h = harness({ config: { accountsFlowId: flow, accountsSecurityReviewed: true }, fetcher(url, options) {
    assert.equal(url, '/_api/cloudflow/v1.0/trigger/' + flow);
    const input = JSON.parse(new URLSearchParams(options.body).get('eventData'));
    assert.equal(input.movement, 'cash_returned');
    assert.equal(input.amount, 100);
    assert.equal(input.employeeId, employee);
    assert.equal(input.postingKey, transaction);
    assert.ok(!('actorId' in input));
    return { status: 200, body: { status: 'posted', postingKey: input.postingKey, employeeId: employee, transactionId: transaction, balance: -100 } };
  } });
  const result = await h.api.postMovement({ employeeId: employee, movement: 'cash_returned', amount: 100, notes: 'Returned cash' });
  assert.equal(result.balance, -100);
  assert.equal(h.api.pendingPostingKey, null);
  assert.equal(h.calls.length, 1);
});
test('unconfirmed flow result retains its key and cannot be replaced with different details', async () => {
  const h = harness({ config: { accountsFlowId: flow, accountsSecurityReviewed: true }, fetcher() { return { status: 202, body: null }; } });
  const value = { employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' };
  await assert.rejects(h.api.postMovement(value), /did not confirm/);
  assert.equal(h.api.pendingPostingKey, transaction);
  await assert.rejects(h.api.postMovement({ ...value, amount: 200 }), /unconfirmed result/);
  assert.equal(h.calls.length, 1);
  await assert.rejects(h.api.postMovement(value), /did not confirm/);
  assert.equal(JSON.parse(new URLSearchParams(h.calls[1].body).get('eventData')).postingKey, transaction);
});
test('missing CSRF token prevents cash posting', async () => {
  const h = harness({ missingToken: true, config: { accountsFlowId: flow, accountsSecurityReviewed: true } });
  await assert.rejects(h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 1, notes: 'Advance' }), /session/);
  assert.equal(h.calls.length, 0);
});
test('no page enables the accounts flow in its shipped default configuration', () => {
  const example = fs.readFileSync('pettycash-module-config.example.js', 'utf8');
  assert.match(example, /accountsFlowId: ""/);
  assert.match(example, /accountsSecurityReviewed: false/);
  assert.match(fs.readFileSync('Accounts Cash Management.html', 'utf8'), /id="pcPostCash"[^>]*disabled/);
});
