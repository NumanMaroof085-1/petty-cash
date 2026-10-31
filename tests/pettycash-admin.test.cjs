const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('pettycash-admin.js', 'utf8');
const admin = '11111111-1111-4111-8111-111111111111';
const manager = '22222222-2222-4222-8222-222222222222';
const department = '33333333-3333-4333-8333-333333333333';
const contact = '44444444-4444-4444-8444-444444444444';
// Fictional mappings for local tests, never tenant defaults.
const config = { creationEnabled: true, securityReviewed: true, departmentIdColumn: 'hr_testdepartmentid',
  contactDepartmentNavigation: 'hr_TestDepartment', contactManagerNavigation: 'hr_TestManager',
  roleValues: { Employee: 10, Manager: 20, Accounts: 30, Admin: 40 } };
const testPassword = 'Synthetic rejected input #123';
const input = { firstName: ' Jane ', lastName: ' Doe ', email: ' Jane@Example.Test ', username: 'jane.doe',
  role: 'Employee', departmentId: department, managerId: manager };
const person = { contactid: manager, fullname: 'Existing Manager', emailaddress1: 'manager@example.test',
  adx_identity_username: 'manager', hr_userrole: 20, statecode: 0 };
const team = { hr_testdepartmentid: department, hr_departmentname: 'Finance', statecode: 0 };
const saved = { contactid: contact, firstname: 'Jane', lastname: 'Doe', emailaddress1: 'jane@example.test',
  adx_identity_username: 'jane.doe', adx_identity_logonenabled: true,
  hr_userrole: 10, hr_currentbalance: 0, _hr_department_value: department, _hr_reportstomanager_value: manager };
function harness({ overrides = {}, allowed = true, signedIn = true, fetcher, missingToken = false,
  origin = 'https://portal.example.test' } = {}) {
  const calls = [];
  const root = { PC_ADMIN_CONFIG: { ...config, ...overrides }, location: { origin },
    document: { readyState: 'loading', addEventListener() {}, getElementById(id) {
      return id === 'pcAdminAllowed' ? { value: String(allowed) } : id === 'portalUserId' ? { value: signedIn ? admin : '' } : null;
    } }, shell: { async getTokenDeferred() { return missingToken ? '' : 'token'; } },
    async fetch(url, options) {
      calls.push({ url, ...options });
      let result = fetcher && await fetcher(url, options, calls.length);
      if (!result) {
        result = options.method === 'POST' ? { status: 204, body: null, entityId: contact } :
          url.startsWith('/_api/hr_departmentses') ? { status: 200, body: { value: [team] } } :
          url.startsWith('/_api/contacts(') ? { status: 200, body: saved } : { status: 200, body: { value: [person] } };
      }
      return { status: result.status, ok: result.status >= 200 && result.status < 300,
        headers: { get(name) { return name === 'entityid' ? result.entityId || null : null; } },
        async text() {
          if (result.textError) throw new Error(result.textError);
          return result.raw === undefined ? result.body === null ? '' : JSON.stringify(result.body) : result.raw;
        } };
    } };
  vm.runInNewContext(script, { window: root, URL, Number, Object, Array, String, Set, Promise });
  return { api: root.PettyCashAdmin, calls };
}
test('admin page has seven profile fields, no password/balance input, and matching reviewed configuration', () => {
  const html = fs.readFileSync('Admin Users.html', 'utf8');
  assert.equal(html.split("{% include 'Petty Cash User Context' %}").length - 1, 1);
  assert.equal(html.split("{% include 'Petty Cash Admin' %}").length - 1, 1);
  assert.ok(html.indexOf("{% include 'Petty Cash User Context' %}") < html.indexOf("{% include 'Petty Cash Admin' %}"));
  assert.doesNotMatch(html, /id="portalUserId"|adx_identity_|hr_currentbalance/);
  assert.equal((html.match(/<(?:input|select)\b/g) || []).length, 7);
  assert.doesNotMatch(html, /type="password"|pcAdminPassword|pcAdminConfirmPassword/);
  assert.match(html, /id="pcAdminUsername"/);
  assert.match(html, /Change Password/);
  assert.doesNotMatch(script, /<\/script|\{%|\{\{/i);
  const example = fs.readFileSync('pettycash-admin-config.example.js', 'utf8');
  const embedded = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(embedded, 'Page includes its reviewed configuration');
  assert.equal(embedded[1].trim(), example.trim(), 'Embedded configuration matches canonical configuration');
  assert.ok(html.indexOf("{% include 'Petty Cash User Context' %}") < html.indexOf('<script>'));
  assert.ok(html.indexOf('</script>') < html.indexOf("{% include 'Petty Cash Admin' %}"));
  assert.match(example, /creationEnabled: true/);
  assert.match(example, /securityReviewed: true/);
  assert.doesNotMatch(example, /credentialSubmissionEnabled|credentialSecurityReviewed/);
  assert.doesNotMatch(script, /adx_identity_newpassword|adx_identity_passwordhash|adx_identity_securitystamp|validatePassword/);
  assert.match(example, /departmentIdColumn: "hr_departmentsid"/);
  assert.match(example, /Employee: 123140000/);
});
test('shared context renders an escaped signed-in identity and cosmetic Admin-role indicator', () => {
  const source = fs.readFileSync('Petty Cash User Context.html', 'utf8');
  assert.equal(source.split('id="pcAdminAllowed"').length - 1, 1);
  assert.match(source, /user\.roles contains 'Petty Cash Admin' %\}true\{% else %\}false/);
});
test('confirmed Department GUID configuration is used for reads, not the text name column', async () => {
  const example = { window: {} };
  vm.runInNewContext(fs.readFileSync('pettycash-admin-config.example.js', 'utf8'), example);
  assert.equal(example.window.PC_ADMIN_CONFIG.departmentIdColumn, 'hr_departmentsid');
  assert.equal(example.window.PC_ADMIN_CONFIG.creationEnabled, true);
  assert.equal(example.window.PC_ADMIN_CONFIG.securityReviewed, true);
  const h = harness({ overrides: { departmentIdColumn: example.window.PC_ADMIN_CONFIG.departmentIdColumn }, fetcher(url) {
    if (url.startsWith('/_api/hr_departmentses')) return { status: 200,
      body: { value: [{ hr_departmentsid: department, hr_departmentname: 'Finance', statecode: 0 }] } };
  } });
  const result = await h.api.loadOptions();
  assert.equal(result.departments[0].hr_departmentsid, department);
  const call = h.calls.find(call => call.url.startsWith('/_api/hr_departmentses'));
  const query = new URL(call.url, 'https://portal.example.test').searchParams;
  assert.equal(query.get('$select'), 'hr_departmentsid,hr_departmentname,statecode');
  assert.equal(query.get('$orderby'), 'hr_departmentname asc,hr_departmentsid asc');
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
});
test('confirmed configuration produces exact profile-only POST and either release gate blocks writes', async () => {
  const example = { window: {} };
  vm.runInNewContext(fs.readFileSync('pettycash-admin-config.example.js', 'utf8'), example);
  const actual = example.window.PC_ADMIN_CONFIG;
  assert.equal(actual.contactDepartmentNavigation, 'hr_Department');
  assert.equal(actual.contactManagerNavigation, 'hr_ReportsToManager');
  const reviewed = { ...actual, creationEnabled: true, securityReviewed: true };
  for (const gate of ['creationEnabled', 'securityReviewed']) {
    const disabled = harness({ overrides: { ...reviewed, [gate]: false } });
    await assert.rejects(disabled.api.createProfile(input), /disabled/);
    assert.equal(disabled.calls.length, 0);
  }
  const h = harness({ overrides: reviewed, fetcher(url) {
    if (url.startsWith('/_api/hr_departmentses')) return { status: 200,
      body: { value: [{ hr_departmentsid: department, hr_departmentname: 'Finance', statecode: 0 }] } };
    if (url.startsWith('/_api/contacts(' + contact + ')')) return { status: 200,
      body: { ...saved, hr_userrole: 123140000 } };
  } });
  const result = await h.api.createProfile(input);
  assert.equal(result.profileCreated, true);
  assert.equal(result.loginProvisioned, false);
  const posts = h.calls.filter(call => call.method === 'POST');
  assert.equal(posts.length, 1);
  assert.deepEqual(JSON.parse(posts[0].body), { firstname: 'Jane', lastname: 'Doe', emailaddress1: 'jane@example.test',
    hr_userrole: 123140000, hr_currentbalance: 0, adx_identity_username: 'jane.doe',
    adx_identity_logonenabled: true,
    'hr_Department@odata.bind': '/hr_departmentses(' + department + ')',
    'hr_ReportsToManager@odata.bind': '/contacts(' + manager + ')' });
});
test('non-admin and signed-out UI checks prevent accidental API calls', async () => {
  for (const settings of [{ allowed: false }, { signedIn: false }]) {
    const h = harness(settings);
    await assert.rejects(h.api.createProfile(input));
    await assert.rejects(h.api.loadOptions());
    assert.equal(h.calls.length, 0);
  }
});
test('blank metadata, duplicate role values, or disabled security gate cannot create', async () => {
  for (const overrides of [{ departmentIdColumn: '' }, { contactManagerNavigation: '' },
    { contactManagerNavigation: 'hr_TestDepartment' }, { roleValues: { Employee: 10, Manager: 10, Accounts: 30, Admin: 40 } },
    { creationEnabled: false }, { securityReviewed: false },
    { creationEnabled: undefined }, { securityReviewed: undefined }]) {
    const h = harness({ overrides });
    await assert.rejects(h.api.createProfile(input));
    assert.equal(h.calls.length, 0);
  }
});
test('payload preserves all fields and initializes only zero summary, ignoring arbitrary balance input', () => {
  const h = harness();
  const value = h.api.validateInput({ ...input, hr_currentbalance: 999 });
  const payload = JSON.parse(JSON.stringify(h.api.buildPayload(value)));
  assert.deepEqual(payload, { firstname: 'Jane', lastname: 'Doe', emailaddress1: 'jane@example.test', hr_userrole: 10, hr_currentbalance: 0,
    adx_identity_username: 'jane.doe', adx_identity_logonenabled: true,
    'hr_TestDepartment@odata.bind': '/hr_departmentses(' + department + ')',
    'hr_TestManager@odata.bind': '/contacts(' + manager + ')' });
});
test('invalid name, email, role or lookup blocks the create', async () => {
  for (const change of [{ lastName: '' }, { firstName: 'x'.repeat(51) }, { email: 'invalid' }, { role: 'Owner' }, { managerId: 'not-guid' }]) {
    const h = harness();
    await assert.rejects(h.api.createProfile({ ...input, ...change }));
    assert.equal(h.calls.length, 0);
  }
});
test('success performs one POST with CSRF and read-back, and never claims login provisioned', async () => {
  const h = harness();
  assert.deepEqual(JSON.parse(JSON.stringify(await h.api.createProfile(input))), { id: contact, profileCreated: true,
    passwordSetupRequired: true, loginProvisioned: false });
  assert.equal(h.api.version, 'admin-profiles-v3');
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(h.calls.find(call => call.method === 'POST').headers.__RequestVerificationToken, 'token');
  assert.equal(h.api.pendingOperation, null);
  assert.ok(h.calls.some(call => call.url.startsWith('/_api/contacts(' + contact + ')')));
  assert.ok(h.calls.every(call => !/password|hash|cashtransaction/i.test(call.url)));
  assert.ok(h.calls.every(call => ['GET', 'POST'].includes(call.method)));
});
test('missing, null or nonzero initial summary fails read-back without overwriting a balance', async () => {
  for (const initial of [undefined, null, 12]) {
    const h = harness({ fetcher(url) {
      if (url.startsWith('/_api/contacts(' + contact + ')')) return { status: 200,
        body: { ...saved, hr_currentbalance: initial } };
    } });
    await assert.rejects(h.api.createProfile(input), /did not retain/);
    assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
    assert.equal(h.api.pendingOperation.id, contact);
    assert.ok(h.calls.every(call => !['PATCH', 'PUT', 'DELETE'].includes(call.method)));
  }
});
test('duplicate email is case-insensitive, includes inactive Contacts and follows all pages', async () => {
  const h = harness({ fetcher(url) {
    if (url === '/_api/contacts?page=2') return { status: 200, body: { value: [{ ...person, contactid: contact, emailaddress1: 'JANE@EXAMPLE.TEST', statecode: 1 }] } };
    if (url.startsWith('/_api/contacts?')) return { status: 200, body: { value: [person], '@odata.nextLink': '/_api/contacts?page=2' } };
  } });
  await assert.rejects(h.api.createProfile(input), /already uses this email/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
});
test('unexpected paging origin blocks create without requesting that origin', async () => {
  const h = harness({ fetcher(url) {
    if (url.startsWith('/_api/contacts?')) return { status: 200, body: { value: [person], '@odata.nextLink': 'https://other.example.test/_api/contacts' } };
  } });
  await assert.rejects(h.api.createProfile(input), /Unexpected paging/);
  assert.ok(h.calls.every(call => call.url.startsWith('/_api/')));
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
});
test('missing Contact email or inactive selected manager blocks create', async () => {
  for (const change of [{ emailaddress1: undefined }, { statecode: 1 }]) {
    const h = harness({ fetcher(url) {
      if (url.startsWith('/_api/contacts?')) return { status: 200, body: { value: [{ ...person, ...change }] } };
    } });
    await assert.rejects(h.api.createProfile(input));
    assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
  }
});
test('missing token cannot read or write profiles', async () => {
  const h = harness({ missingToken: true });
  await assert.rejects(h.api.createProfile(input), /session/);
  assert.equal(h.calls.length, 0);
});
test('definite Contact create 403 is not retried by stripping fields', async () => {
  const h = harness({ fetcher(url, options) {
    if (options.method === 'POST') return { status: 403, body: { error: { message: 'Permission denied' } } };
  } });
  await assert.rejects(h.api.createProfile(input), /HTTP 403/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(h.api.pendingOperation, null);
});
test('ambiguous create blocks another POST on the same page', async () => {
  const h = harness({ fetcher(url, options) { if (options.method === 'POST') throw new Error('Connection interrupted'); } });
  await assert.rejects(h.api.createProfile(input), /connection was interrupted/i);
  await assert.rejects(h.api.createProfile(input), /uncertain/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(h.api.pendingOperation.uncertain, true);
});
test('successful create without ID blocks retries as uncertain', async () => {
  const h = harness({ fetcher(url, options) { if (options.method === 'POST') return { status: 204, body: null }; } });
  await assert.rejects(h.api.createProfile(input), /ID was not returned/);
  await assert.rejects(h.api.createProfile(input), /uncertain/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
});
test('read-back failure resumes verification only and prohibits changed input', async () => {
  let reads = 0;
  const h = harness({ fetcher(url) {
    if (url.startsWith('/_api/contacts(' + contact + ')') && ++reads === 1) return { status: 200, body: { ...saved, lastname: 'Wrong' } };
  } });
  await assert.rejects(h.api.createProfile(input), /did not retain/);
  await assert.rejects(h.api.createProfile({ ...input, lastName: 'Changed' }), /already saved/);
  assert.equal((await h.api.createProfile(input)).profileCreated, true);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
});
test('read-only setup never claims verified write access or login provisioning', async () => {
  const h = harness({ overrides: { creationEnabled: false } });
  const report = await h.api.checkSetup();
  assert.equal(report.creationEnabled, false);
  assert.equal(report.writePermissionsVerified, false);
  assert.equal(report.loginProvisioned, false);
  assert.equal(report.profileOnly, true);
  assert.equal(report.passwordSetupRequired, true);
  assert.ok(h.calls.every(call => call.method === 'GET'));
});
test('relationship inspector works before metadata configuration and returns only annotations', async () => {
  const h = harness({ overrides: { departmentIdColumn: '' }, fetcher(url) {
    if (url.startsWith('/_api/contacts(' + admin + ')')) return { status: 200, body: {
      '_hr_department_value@Microsoft.Dynamics.CRM.associatednavigationproperty': 'hr_ActualDepartment',
      '_hr_reportstomanager_value@Microsoft.Dynamics.CRM.associatednavigationproperty': 'hr_ActualManager' } };
  } });
  const report = await h.api.inspectProfileRelationships();
  assert.equal(report.department, 'hr_ActualDepartment'); assert.equal(report.manager, 'hr_ActualManager');
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].method, 'GET');
});
test('username is required separately and email never silently becomes username', async () => {
  for (const username of ['', 'ab', 'has space', 'x'.repeat(101), '-starts-dash']) {
    const h = harness();
    await assert.rejects(h.api.createProfile({ ...input, username }), /username/);
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  const value = h.api.validateInput(input);
  assert.equal(value.username, 'jane.doe');
  assert.notEqual(value.username, value.email);
  assert.equal(Object.prototype.hasOwnProperty.call(value, 'password'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(value, 'confirmPassword'), false);
});
test('credential-like API inputs are rejected before any request and never echoed', async () => {
  for (const key of ['password', 'confirmPassword', 'newPassword', 'adx_identity_newpassword',
    'adx_identity_passwordhash', 'adx_identity_securitystamp']) {
    const h = harness();
    await assert.rejects(h.api.createProfile({ ...input, [key]: testPassword }), error => {
      assert.match(error.message, /profiles only/);
      assert.ok(!error.message.includes(testPassword));
      return true;
    });
    assert.equal(h.calls.length, 0);
  }
});
test('stale credential enable flags cannot restore the removed password-writing path', async () => {
  const h = harness({ overrides: { credentialSubmissionEnabled: true, credentialSecurityReviewed: true } });
  await h.api.createProfile(input);
  const posts = h.calls.filter(call => call.method === 'POST');
  assert.equal(posts.length, 1);
  assert.doesNotMatch(posts[0].body, /password|securitystamp/i);
  assert.equal(JSON.parse(posts[0].body).adx_identity_username, 'jane.doe');
  assert.equal(JSON.parse(posts[0].body).adx_identity_logonenabled, true);
  assert.equal(Object.prototype.hasOwnProperty.call(JSON.parse(posts[0].body), 'adx_identity_passwordhash'), false);
  assert.ok(h.calls.filter(call => call.method === 'GET').every(call => !/newpassword|passwordhash|securitystamp/.test(call.url)));
});
test('duplicate username is case-insensitive, includes inactive Contacts and prevents a profile POST', async () => {
  const h = harness({ fetcher(url) {
    if (url.startsWith('/_api/contacts?')) return { status: 200, body: { value: [{ ...person,
      adx_identity_username: 'JANE.DOE', statecode: 1 }] } };
  } });
  await assert.rejects(h.api.createProfile(input), /already uses this username/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
});
test('missing username selection blocks duplicate checks instead of silently accepting partial data', async () => {
  const h = harness({ fetcher(url) {
    if (url.startsWith('/_api/contacts?')) return { status: 200, body: { value: [{ ...person, adx_identity_username: undefined }] } };
  } });
  await assert.rejects(h.api.createProfile(input), /username was not returned/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 0);
});
test('POST error details are redacted, including unexpected secret-like server content', async () => {
  const h = harness({ fetcher(url, options) {
    if (options.method === 'POST') return { status: 400, body: { error: { message: 'Rejected secret: ' + testPassword } } };
  } });
  await assert.rejects(h.api.createProfile(input), error => {
    assert.match(error.message, /HTTP 400/); assert.equal(error.status, 400);
    assert.ok(!String(error.stack).includes(testPassword)); assert.equal(error.details, undefined); return true;
  });
  assert.equal(h.api.pendingOperation, null);
});
test('transport errors become generic and block another POST', async () => {
  const h = harness({ fetcher(url, options) { if (options.method === 'POST') throw new Error('Echo ' + testPassword); } });
  await assert.rejects(h.api.createProfile(input), error => {
    assert.ok(!String(error.stack).includes(testPassword)); assert.equal(error.cause, undefined); return true;
  });
  assert.ok(!JSON.stringify(h.api.pendingOperation).includes(testPassword));
  await assert.rejects(h.api.createProfile(input), /uncertain/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
});
test('verification retry keeps only profile data and never repeats a confirmed save', async () => {
  let reads = 0;
  const h = harness({ fetcher(url) {
    if (url.startsWith('/_api/contacts(' + contact + ')') && ++reads === 1) return { status: 200,
      body: { ...saved, adx_identity_logonenabled: false } };
  } });
  await assert.rejects(h.api.createProfile(input), /did not retain/);
  assert.ok(!JSON.stringify(h.api.pendingOperation).includes(testPassword));
  assert.equal((await h.api.createProfile(input)).profileCreated, true);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
});
test('HTTPS is required before creating profiles', async () => {
  const h = harness({ origin: 'http://portal.example.test' });
  await assert.rejects(h.api.createProfile(input), /requires HTTPS/);
  assert.equal(h.calls.length, 0);
});

test('script defaults fail closed when configuration is absent', async () => {
  const h = harness({ overrides: { creationEnabled: undefined, securityReviewed: undefined } });
  await assert.rejects(h.api.createProfile(input), /disabled/);
  assert.equal(h.calls.length, 0);
});
test('response-read failures cannot expose a secret and keep the create outcome uncertain', async () => {
  const h = harness({ fetcher(url, options) {
    if (options.method === 'POST') return { status: 204, body: null, textError: 'Echo ' + testPassword };
  } });
  await assert.rejects(h.api.createProfile(input), error => {
    assert.match(error.message, /response was interrupted/);
    assert.ok(!String(error.stack).includes(testPassword)); return true;
  });
  assert.equal(h.api.pendingOperation.uncertain, true);
  await assert.rejects(h.api.createProfile(input), /uncertain/);
  assert.equal(h.calls.filter(call => call.method === 'POST').length, 1);
});
