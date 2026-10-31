const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('pettycash-modules.js', 'utf8');
const employee = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const flow = '33333333-3333-4333-8333-333333333333';
const transaction = '44444444-4444-4444-8444-444444444444';
test('all page fragments include the shared Web Template once without requesting the blocked Web File', () => {
  const include = "{% include 'Petty Cash Modules' %}";
  for (const file of ['New Petty Cash Request.html', 'My Petty Cash Requests.html', 'Accounts Cash Management.html', 'Finance Cash Management.html']) {
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
test('the employee page is titled My Requests without changing its module identity', () => {
  const html = fs.readFileSync('My Petty Cash Requests.html', 'utf8');
  assert.match(html, /<h2>My Requests<\/h2>/);
  assert.match(html, /data-pc-page="requests"/);
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
function harness({ config = {}, fetcher, missingToken = false, finance = true, signedIn = true, source = script,
  origin = 'https://portal.example.test' } = {}) {
  const calls = [];
  const root = { location: { origin }, PC_MODULE_CONFIG: config,
    shell: { async getTokenDeferred() { return missingToken ? '' : 'token'; } },
    crypto: { randomUUID() { return transaction; } },
    document: { readyState: 'loading', addEventListener() {}, getElementById(id) {
      return id === 'pcFinanceAllowed' ? { value: String(finance) } : id === 'pcModuleUserId' ? { value: signedIn ? other : '' } : null;
    } },
    async fetch(url, options) {
      calls.push({ url, ...options });
      const result = fetcher ? await fetcher(url, options, calls.length) : { status: 200, body: { value: [] } };
      return { status: result.status, ok: result.status >= 200 && result.status < 300,
        async text() { return result.rawBody !== undefined ? result.rawBody : result.body === null ? '' : JSON.stringify(result.body); } };
    }
  };
  vm.runInNewContext(source, { window: root, URL, URLSearchParams, Intl, Number, Object, Array, Set, Promise });
  return { api: root.PettyCashModules, calls, root };
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

test('ledger balance is not capped at the first 100 transactions', async () => {
  const firstPage = Array.from({ length: 100 }, () => row(123140000, 1));
  const allRows = [...firstPage, row(123140000, 500)];
  const h = harness({ fetcher(url) {
    const query = new URL(url, 'https://portal.example.test').searchParams;
    // Model $top as an overall result limit, not a requested page size.
    const top = query.get('$top');
    if (top !== null) return { status: 200, body: { value: allRows.slice(0, Number(top)) } };
    return { status: 200, body: query.has('$skiptoken') ? { value: allRows.slice(100) }
      : { value: firstPage, '@odata.nextLink': '/_api/hr_cashtransactions?$skiptoken=page2' } };
  } });
  assert.equal(await h.api.readBalance(employee), 600);
  assert.equal(h.calls.length, 2);
  assert.equal(new URL(h.calls[0].url, 'https://portal.example.test').searchParams.has('$top'), false);
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
test('Finance flow uses site-authenticated eventData transport, not direct ledger or balance writes', async () => {
  const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher(url, options) {
    assert.equal(url, '/_api/cloudflow/v1.0/trigger/' + flow);
    assert.equal(options.headers['X-Requested-With'], 'XMLHttpRequest');
    const input = JSON.parse(new URLSearchParams(options.body).get('eventData'));
    assert.equal(input.movement, 'cash_returned');
    assert.equal(input.amount, 100);
    assert.equal(input.employeeId, employee);
    assert.equal(input.postingKey, transaction);
    assert.ok(!('actorId' in input));
    return { status: 200, body: { status: 'posted', postingKey: input.postingKey, employeeId: employee, transactionId: transaction } };
  } });
  const result = await h.api.postMovement({ employeeId: employee, movement: 'cash_returned', amount: 100, notes: 'Returned cash' });
  assert.equal(result.transactionId, transaction);
  assert.equal(Object.hasOwn(result, 'balance'), false);
  assert.equal(h.api.pendingPostingKey, null);
  assert.equal(h.calls.length, 1);
});
test('unconfirmed flow result retains its key and cannot be replaced with different details', async () => {
  const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher() { return { status: 202, body: null }; } });
  const value = { employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' };
  await assert.rejects(h.api.postMovement(value), /did not confirm/);
  assert.equal(h.api.pendingPostingKey, transaction);
  await assert.rejects(h.api.postMovement({ ...value, amount: 200 }), /unconfirmed result/);
  assert.equal(h.calls.length, 1);
  await assert.rejects(h.api.postMovement(value), /did not confirm/);
  assert.equal(JSON.parse(new URLSearchParams(h.calls[1].body).get('eventData')).postingKey, transaction);
});
test('missing CSRF token prevents cash posting', async () => {
  const h = harness({ missingToken: true, config: { financeFlowId: flow, financeSecurityReviewed: true } });
  await assert.rejects(h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 1, notes: 'Advance' }), /session/);
  assert.equal(h.calls.length, 0);
});

test('non-JSON posting responses preserve HTTP status and operation key without guessing sign-in or leaking HTML', async () => {
  for (const status of [500, 200]) {
    const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher() {
      return { status, rawBody: '<html><body>session-secret <script>private()</script></body></html>' };
    } });
    const value = { employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' };
    await assert.rejects(h.api.postMovement(value), error => {
      assert.equal(error.status, status);
      assert.match(error.message, new RegExp('HTTP ' + status));
      assert.match(error.message, /flow run history/);
      assert.doesNotMatch(error.message, /sign-in session|session-secret|<html>|private\(/);
      return true;
    });
    assert.equal(h.api.pendingPostingKey, transaction);
    assert.equal(h.calls.length, 1, 'An error must not trigger an automatic cash retry');
  }
});
test('Finance page and canonical configuration match and keep posting disabled by default', () => {
  const example = fs.readFileSync('pettycash-module-config.example.js', 'utf8');
  assert.match(example, /financeFlowId: ""/);
  assert.match(example, /financeSecurityReviewed: false/);
  const html = fs.readFileSync('Finance Cash Management.html', 'utf8');
  assert.match(html, /id="pcPostCash"[^>]*disabled/);
  assert.match(html, /id="pcFinanceForm" hidden/);
  assert.equal(html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1].trim().replace(/\r\n/g, '\n'), example.trim().replace(/\r\n/g, '\n'));
  const context = fs.readFileSync('Petty Cash User Context.html', 'utf8');
  assert.match(context, /id="pcFinanceAllowed" value="\{% if user.roles contains 'Petty Cash Finance' %\}true\{% else %\}false\{% endif %\}"/);
});

test('old Accounts configuration never enables Finance posting', () => {
  assert.equal(harness({ config: { accountsFlowId: flow, accountsSecurityReviewed: true } }).api.flowReady(), false);
});

test('non-Finance and signed-out callers cannot read Finance employees or invoke a configured flow', async () => {
  for (const flags of [{ finance: false }, { signedIn: false }]) {
    const h = harness({ ...flags, config: { financeFlowId: flow, financeSecurityReviewed: true } });
    await assert.rejects(h.api.employees());
    await assert.rejects(h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 10, notes: 'Advance' }));
    assert.equal(h.calls.length, 0);
  }
});

test('positive decimal amounts are canonicalized; unsafe cents, exponents and separators are rejected', () => {
  const h = harness(), value = { employeeId: employee, movement: 'cash_given', notes: 'Advance' };
  assert.equal(h.api.validateMovement({ ...value, amount: '001.20' }).amount, 1.2);
  assert.equal(h.api.validateMovement({ ...value, amount: '.50' }).amount, 0.5);
  for (const amount of ['1e3', '1,000', '+1', '1.001', '0.00', '', '9007199254740991']) {
    assert.throws(() => h.api.validateMovement({ ...value, amount }), /positive amount/);
  }
  for (const notes of ['', 'x'.repeat(101)]) assert.throws(() => h.api.validateMovement({ ...value, amount: 1, notes }), /reason/);
});

test('cash previews use integer cents and preserve negative balances without writing anything', () => {
  const h = harness();
  assert.equal(h.api.projectedBalance(-100, 'cash_given', 100).balance, 0);
  assert.equal(h.api.projectedBalance(100, 'cash_returned', 150).balance, -50);
  assert.equal(h.api.projectedBalance(0.1, 'cash_given', 0.2).balance, 0.3);
  assert.throws(() => h.api.projectedBalance(null, 'cash_given', 1), /valid employee/);
  assert.throws(() => h.api.projectedBalance(0, 'expense_approved', 1), /Choose cash/);
  assert.equal(h.calls.length, 0);
});

test('Finance employee list requires active records and usernames, and follows all pages', async () => {
  const profile = { contactid: employee, fullname: 'Example', adx_identity_username: 'example', statecode: 0 };
  const h = harness({ fetcher(url) { return { status: 200, body: url.includes('page=2')
    ? { value: [{ ...profile, contactid: other }] }
    : { value: [profile], '@odata.nextLink': '/_api/contacts?page=2' } }; } });
  assert.equal((await h.api.employees()).length, 2);
  assert.ok(h.calls[0].url.includes('adx_identity_username'));
  assert.ok(h.calls.every(call => call.method === 'GET'));
  for (const invalid of [{ ...profile, statecode: 1 }, { ...profile, adx_identity_username: undefined }]) {
    const bad = harness({ fetcher() { return { status: 200, body: { value: [invalid] } }; } });
    await assert.rejects(bad.api.employees(), /username was not returned/);
  }
});

test('malformed posting confirmations never clear the operation key or claim success', async () => {
  for (const change of [{ status: 'unconfirmed' }, { status: 'conflict' }, { employeeId: other }, { transactionId: 'invalid' },
    { transactionId: undefined }, { postingKey: other }]) {
    const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher() {
      return { status: 200, body: { status: 'posted', postingKey: transaction, employeeId: employee, transactionId: transaction, balance: 100, ...change } };
    } });
    await assert.rejects(h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' }));
    assert.equal(h.api.pendingPostingKey, transaction);
  }
});

test('confirmed postings ignore legacy balance fields and permit a new movement after confirmation', async () => {
  for (const balance of [undefined, 0, '100', 0.001, null]) {
    const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher() {
      return { status: 200, body: { status: 'posted', postingKey: transaction, employeeId: employee, transactionId: transaction, balance } };
    } });
    const value = { employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' };
    const result = await h.api.postMovement(value);
    assert.equal(Object.hasOwn(result, 'balance'), false, 'Never expose a placeholder as a confirmed balance');
    assert.equal(h.api.pendingPostingKey, null);
    await h.api.postMovement({ ...value, amount: 50, notes: 'Separate cash movement' });
    assert.equal(h.calls.length, 2, 'A confirmed operation does not lock the next draft');
  }
});

test('Power Pages lowercase output names confirm the same event and mismatched lowercase keys remain pending', async () => {
  for (const key of [transaction, other]) {
    const h = harness({ config: { financeFlowId: flow, financeSecurityReviewed: true }, fetcher() {
      return { status: 200, body: { status: 'posted', postingkey: key, employeeid: employee, transactionid: transaction, balance: 0 } };
    } });
    const operation = h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Advance' });
    if (key === transaction) {
      const result = await operation;
      assert.equal(result.transactionId, transaction);
      assert.equal(result.employeeId, employee);
      assert.equal(h.api.pendingPostingKey, null);
    } else {
      await assert.rejects(operation, /did not confirm/);
      assert.equal(h.api.pendingPostingKey, transaction);
    }
  }
});

test('console transport repair preserves an already pending operation, CSRF and body without sending a request on install', async () => {
  const oldSource = script.replace(/\r\n/g, '\n').replace(',\n          "X-Requested-With": "XMLHttpRequest"', '')
    .replace('body[name] ?? body[name.toLowerCase()]', 'body[name]');
  assert.doesNotMatch(oldSource, /"X-Requested-With": "XMLHttpRequest"/);
  const h = harness({ source: oldSource, config: { financeFlowId: flow, financeSecurityReviewed: true } });
  const requests = []; let savedRows = 0;
  h.root.fetch = async (url, options) => {
    const headers = new Headers(options.headers);
    const input = JSON.parse(new URLSearchParams(options.body).get('eventData'));
    requests.push({ url, input });
    assert.equal(headers.get('__RequestVerificationToken'), 'token');
    assert.match(headers.get('Content-Type'), /application\/x-www-form-urlencoded/);
    if (headers.get('X-Requested-With') !== 'XMLHttpRequest') return new Response('<html>500</html>', { status: 500 });
    savedRows++;
    return new Response(JSON.stringify({ status: 'posted', postingkey: input.postingKey,
      employeeid: input.employeeId, transactionid: transaction, balance: 0 }), { status: 200 });
  };
  const value = { employeeId: employee, movement: 'cash_given', amount: 100, notes: 'Original pending movement' };
  await assert.rejects(h.api.postMovement(value), /HTTP 500/);
  assert.equal(savedRows, 0);
  const pendingKey = h.api.pendingPostingKey;
  const repair = fs.readFileSync('scripts/repair_open_finance_page.js', 'utf8');
  vm.runInNewContext(repair, { window: h.root, Headers, Response });
  vm.runInNewContext(repair, { window: h.root, Headers, Response });
  assert.equal(requests.length, 1, 'Installing or repeating the repair never submits cash');
  assert.equal(h.api.pendingPostingKey, pendingKey);
  const result = await h.api.postMovement(value);
  assert.equal(result.transactionId, transaction);
  assert.equal(h.api.pendingPostingKey, null);
  assert.equal(savedRows, 1);
  assert.deepEqual(requests[0], requests[1], 'Retry must retain the exact original endpoint, values and key');
});

test('Finance cash posting refuses insecure origins and keeps direct table writes unavailable', async () => {
  const h = harness({ origin: 'http://portal.example.test', config: { financeFlowId: flow, financeSecurityReviewed: true } });
  await assert.rejects(h.api.postMovement({ employeeId: employee, movement: 'cash_given', amount: 1, notes: 'Advance' }), /HTTPS/);
  assert.equal(h.calls.length, 0);
});
