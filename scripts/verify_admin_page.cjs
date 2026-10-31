// Browser QA only. Every request is mocked; no tenant connection or deployment.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const admin = '11111111-1111-4111-8111-111111111111';
const manager = '22222222-2222-4222-8222-222222222222';
const department = '33333333-3333-4333-8333-333333333333';
const contact = '44444444-4444-4444-8444-444444444444';
const mockConfig = { creationEnabled: true, securityReviewed: true, departmentIdColumn: 'hr_testdepartmentid',
  contactDepartmentNavigation: 'hr_TestDepartment', contactManagerNavigation: 'hr_TestManager',
  roleValues: { Employee: 10, Manager: 20, Accounts: 30, Admin: 40 } };
(async () => {
  const qa = path.join(root, 'documentation', 'qa', 'pages');
  fs.mkdirSync(qa, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const mode of ['enabled', 'disabled', 'non-admin', 'unconfigured', 'legacy-html', 'rejected', 'verification-retry']) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      const errors = [], calls = []; let payload;
      page.on('pageerror', error => errors.push(error.message));
      const contextSource = fs.readFileSync(path.join(root, 'Petty Cash User Context.html'), 'utf8');
      const context = contextSource.replace(/\{\{ user.id \| escape \}\}/g, admin)
        .replace(/\{\{ user.fullname \| escape \}\}/g, 'Test administrator')
        .replace(/\{\{ user.emailaddress1 \| escape \}\}/g, 'admin@example.test')
        .replace("{% if user.roles contains 'Petty Cash Accounts' %}true{% else %}false{% endif %}", 'false')
        .replace("{% if user.roles contains 'Petty Cash Finance' %}true{% else %}false{% endif %}", 'false')
        .replace("{% if user.roles contains 'Petty Cash Admin' %}true{% else %}false{% endif %}", mode === 'non-admin' ? 'false' : 'true');
      const writeMode = ['enabled', 'rejected', 'verification-retry'].includes(mode);
      const config = { ...mockConfig, creationEnabled: mode === 'disabled' ? false : true,
        departmentIdColumn: mode === 'unconfigured' ? '' : mockConfig.departmentIdColumn };
      let fragment = fs.readFileSync(path.join(root, 'Admin Users.html'), 'utf8')
        .replace("{% include 'Petty Cash User Context' %}", () => context)
        .replace("{% include 'Petty Cash Admin' %}", () => '<script>window.PC_ADMIN_CONFIG=' + JSON.stringify(config) + ';</script><script>' + fs.readFileSync(path.join(root, 'pettycash-admin.js'), 'utf8') + '</script>');
      assert.doesNotMatch(fragment, /\{%|\{\{/);
      if (mode === 'legacy-html') fragment = fragment.replace('<form id="pcAdminForm" hidden>',
        '<form id="pcAdminForm" hidden><input id="pcAdminPassword" type="password">');
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        assert.equal(url.origin, 'https://portal.example.test');
        if (url.pathname === '/preview') {
          await route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><script>window.shell={getTokenDeferred:async()=>"mock-token"};</script>' + fragment + '</body></html>' });
          return;
        }
        calls.push({ method: route.request().method(), url: url.href });
        if (url.pathname === '/_api/contacts' && route.request().method() === 'POST') {
          payload = route.request().postDataJSON();
          if (mode === 'rejected') await route.fulfill({ status: 400,
            json: { error: { message: 'Unexpected server details must not be displayed' } } });
          else await route.fulfill({ status: 204, headers: { entityid: contact }, body: '' });
        } else if (url.pathname === '/_api/contacts') {
          await route.fulfill({ json: { value: [{ contactid: manager, fullname: '<img src=x onerror=alert(1)> Manager',
            emailaddress1: 'manager@example.test', adx_identity_username: 'manager', statecode: 0, hr_userrole: 20 }] } });
        } else if (url.pathname === '/_api/hr_departmentses') {
          await route.fulfill({ json: { value: [{ hr_testdepartmentid: department, hr_departmentname: 'Finance', statecode: 0 }] } });
        } else if (url.pathname === '/_api/contacts(' + contact + ')') {
          const reads = calls.filter(call => call.url.includes('/_api/contacts(' + contact + ')')).length;
          await route.fulfill({ json: { contactid: contact, firstname: 'Jane', lastname: 'Doe', emailaddress1: 'jane@example.test',
            adx_identity_username: 'jane.doe', adx_identity_logonenabled: mode !== 'verification-retry' || reads > 1,
            hr_userrole: 10, hr_currentbalance: 0, _hr_department_value: department, _hr_reportstomanager_value: manager } });
        } else throw new Error('Unexpected API request: ' + url.href);
      });
      await page.goto('https://portal.example.test/preview');
      await page.waitForFunction(() => !document.querySelector('#pcAdminMessage').textContent.includes('Checking administrator'));
      assert.equal(await page.locator('#portalUserId').count(), 1);
      assert.equal(await page.evaluate(() => window.PettyCashAdmin.version), 'admin-profiles-v3');
      if (mode !== 'legacy-html') {
        assert.equal(await page.locator('#pcAdminForm input, #pcAdminForm select').count(), 7);
        assert.equal(await page.locator('input[type="password"]').count(), 0);
      }
      if (writeMode) {
        await page.waitForFunction(() => !document.querySelector('#pcAdminCreate').disabled);
        assert.equal(await page.locator('#pcAdminManager img').count(), 0);
        await page.locator('#pcAdminFirstName').fill('Jane');
        await page.locator('#pcAdminLastName').fill('Doe');
        await page.locator('#pcAdminEmail').fill('jane@example.test');
        await page.locator('#pcAdminUsername').fill('jane.doe');
        await page.locator('#pcAdminDepartment').selectOption(department);
        await page.locator('#pcAdminManager').selectOption(manager);
        if (mode === 'enabled') await page.screenshot({ path: path.join(qa, 'admin-desktop.png'), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        if (mode === 'enabled') await page.screenshot({ path: path.join(qa, 'admin-mobile.png'), fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
        await page.getByRole('button', { name: 'Create Contact profile' }).click();
        if (mode === 'verification-retry') {
          await page.waitForFunction(() => document.querySelector('#pcAdminCreate').textContent.includes('Verify saved'));
          await page.getByRole('button', { name: 'Verify saved Contact' }).click();
        }
        if (mode === 'rejected') await page.waitForFunction(() => document.querySelector('#pcAdminMessage').textContent.includes('HTTP 400'));
        else {
          await page.waitForFunction(() => document.querySelector('#pcAdminMessage').textContent.includes('Profile created.'));
          assert.match(await page.locator('#pcAdminMessage').textContent(), /Set the password using Portal Management → Change Password/);
        }
        assert.doesNotMatch(await page.locator('#pcAdminMessage').textContent(), /Unexpected server details/);
        assert.equal(calls.filter(call => call.method === 'POST').length, 1);
        assert.deepEqual(Object.keys(payload).sort(), ['firstname', 'lastname', 'emailaddress1', 'adx_identity_username',
          'adx_identity_logonenabled', 'hr_userrole', 'hr_currentbalance', 'hr_TestDepartment@odata.bind', 'hr_TestManager@odata.bind'].sort());
        assert.doesNotMatch(JSON.stringify(payload), /password|securitystamp/i);
        assert.equal(payload.hr_currentbalance, 0);
      } else {
        await page.waitForFunction(() => !document.querySelector('#pcAdminMessage').textContent.includes('Checking administrator'));
        assert.equal(await page.locator('#pcAdminCreate').isDisabled(), true);
        if (['non-admin', 'legacy-html'].includes(mode)) assert.equal(await page.locator('#pcAdminForm').isVisible(), false);
        if (mode === 'disabled') assert.equal(await page.locator('#pcAdminForm').isVisible(), true);
        if (mode === 'legacy-html') assert.match(await page.locator('#pcAdminMessage').textContent(), /Old Admin page HTML detected/);
        if (['non-admin', 'unconfigured', 'legacy-html'].includes(mode)) assert.equal(calls.length, 0);
        assert.equal(calls.filter(call => call.method === 'POST').length, 0);
      }
      assert.deepEqual(errors, []);
      await page.close();
      console.log('Verified admin page: ' + mode + ' (mock APIs only).');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
