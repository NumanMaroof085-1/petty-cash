// Browser QA with actual local templates and a LIMITED synthetic Liquid/Bootstrap host.
// No Power Pages engine, tenant data, sign-in/out, cash posting or profile creation is invoked.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const { fragments, read, employee } = require('./shell_fixtures.cjs');
const root = path.resolve(__dirname, '..');
// Only the native host's expected show/hide contract is mocked; production retains its Bootstrap 5.
const bootstrapFixture = `
window.hostLoaded = false;
window.onload = () => { window.hostLoaded = true; };
window.bootstrap = { Collapse: { getInstance(el) { return { hide() { el.classList.remove('show'); } }; } } };
document.addEventListener('click', e => {
  const collapse = e.target.closest('[data-bs-toggle="collapse"]');
  if (collapse) { e.preventDefault(); const el = document.querySelector(collapse.dataset.bsTarget); const open = el.classList.toggle('show'); collapse.setAttribute('aria-expanded', String(open)); }
  const dropdown = e.target.closest('[data-bs-toggle="dropdown"]');
  if (dropdown) { e.preventDefault(); const open = dropdown.nextElementSibling.classList.toggle('show'); dropdown.setAttribute('aria-expanded', String(open)); }
});`;
const hostCss = `body{margin:0;font-family:'Segoe UI',sans-serif;color:#172b35}ul{list-style:none}a{text-decoration:none}.dropdown{position:relative}.dropdown-menu{display:none;position:absolute;list-style:none}.dropdown-menu.show{display:block}.dropdown-toggle::after{content:'';display:inline-block;margin-left:4px;border-top:4px solid;border-left:4px solid transparent;border-right:4px solid transparent}.navbar-nav{list-style:none}.form-control{height:34px}.navbar-dark .nav-link{color:#fff}.navbar-toggler-icon{background-image:none}h1,h2,h3,p{margin:0}`;
const records = [
  { hr_pettycashrequestid: '22222222-2222-4222-8222-222222222222', hr_requesttitle: 'PCR-000128', hr_transactiondate: '2026-10-31', hr_totalamount: 2400, hr_approvalstatus: 123140000, hr_paymentsource: 123140000, _hr_submittedby_value: employee },
  { hr_pettycashrequestid: '33333333-3333-4333-8333-333333333333', hr_requesttitle: 'PCR-000127', hr_transactiondate: '2026-10-30', hr_totalamount: 1850, hr_approvalstatus: 123140001, hr_paymentsource: 123140000, _hr_submittedby_value: employee },
  { hr_pettycashrequestid: '44444444-4444-4444-8444-444444444444', hr_requesttitle: 'PCR-000126', hr_transactiondate: '2026-10-29', hr_totalamount: 600, hr_approvalstatus: 123140002, hr_paymentsource: 123140001, _hr_submittedby_value: employee }
];
(async () => {
  const qa = path.join(root, 'documentation', 'qa', 'shell'); fs.mkdirSync(qa, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const mode of ['employee', 'finance', 'admin', 'both', 'anonymous', 'empty', 'ledger-error', 'requests-error', 'isolation', 'long-name', 'fr', 'it']) {
      const signedIn = mode !== 'anonymous', finance = ['finance', 'both'].includes(mode), admin = ['admin', 'both'].includes(mode);
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: mode === 'fr' ? 'fr' : mode === 'it' ? 'it' : 'en-US' });
      page.setDefaultTimeout(10000);
      const errors = [], calls = []; let gateReads = false;
      page.on('pageerror', err => errors.push(err.message));
      const html = fragments({ signedIn, finance, admin, language: mode === 'fr' ? 'fr' : 'en',
        fullname: mode === 'long-name' ? '<img src=x onerror=alert(1)>VeryLongEmployeeNameWithNoSpacesAtAll' : 'Ayesha Khan' });
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        assert.equal(url.origin, 'https://portal.example.test', 'No external asset or API request');
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + hostCss + '</style></head><body>' +
          '<script>window.shell={getTokenDeferred:async()=>"test-token"};' + bootstrapFixture + '</script>' + html.header +
          '<main id="mainContent">' + html.page + '</main>' + html.footer + '</body></html>' });
        calls.push({ method: request.method(), path: url.pathname });
        assert.equal(request.method(), 'GET');
        if (gateReads) await new Promise(resolve => setTimeout(resolve, 80));
        if (url.pathname === '/_api/hr_cashtransactions') return route.fulfill(mode === 'ledger-error' ?
          { status: 503, json: { error: { message: 'Synthetic ledger unavailable' } } } :
          { json: { value: mode === 'empty' ? [] : [
            { hr_transactiontype: 123140000, hr_amount: 10000, _hr_employee_value: employee, hr_transactionreference: 'CT-001' },
            { hr_transactiontype: 123140001, hr_amount: 1850, _hr_employee_value: employee,
              _hr_linkedrequest_value: records[1].hr_pettycashrequestid, hr_transactionreference: 'CT-002' }
          ] } });
        if (url.pathname === '/_api/hr_pettycashrequests') return route.fulfill(mode === 'requests-error' ?
          { status: 503, json: { error: { message: 'Synthetic requests unavailable' } } } :
          { json: { value: mode === 'empty' ? [] : mode === 'isolation' ? [{ ...records[0], hr_requesttitle: 'PRIVATE-OTHER-EMPLOYEE', _hr_submittedby_value: records[0].hr_pettycashrequestid }] : records } });
        throw new Error('Unexpected request: ' + url.href);
      });
      await page.goto('https://portal.example.test/');
      assert.equal(await page.evaluate(() => window.hostLoaded), true, 'Original host onload must remain registered');
      assert.equal(await page.locator('#pcSiteHeader').count(), 1);
      assert.equal(await page.locator('#pcSiteFooter').count(), 1);
      assert.equal(await page.locator('#pcSiteHeader li.weblink > a[href="/"]').getAttribute('aria-current'), 'page');
      assert.equal(await page.locator('.skip-to-content a').getAttribute('href'), '#mainContent');
      assert.equal(await page.locator('#pcSiteHeader a[href="/Finance-Cash-Management/"]').count(), Number(finance));
      assert.equal(await page.locator('#pcSiteHeader a[href="/Admin-Users/"]').count(), Number(admin));
      if (signedIn) {
        if (mode !== 'long-name') assert.equal(await page.locator('.pc-user-avatar').textContent(), 'A');
        await page.waitForFunction(() => document.querySelector('#pcHomeRefresh').disabled === false && !document.querySelector('#pcHomeBalance').textContent.includes('Loading'));
        assert.equal(await page.locator('#portalUserId').count(), 1);
        assert.equal(await page.locator('#pcModuleUserId').count(), 1);
        assert.equal(calls.length, 2);
        assert.equal(await page.locator('.pc-home-tool[href="/Finance-Cash-Management/"]').count(), Number(finance));
        assert.equal(await page.locator('.pc-home-tool[href="/Admin-Users/"]').count(), Number(admin));
        if (mode === 'ledger-error') {
          assert.equal(await page.locator('#pcHomeBalance').textContent(), 'Unavailable');
          assert.match(await page.locator('#pcHomeBalanceMeaning').textContent(), /Synthetic ledger unavailable/);
          assert.equal(await page.locator('#pcHomeRequests .pc-status').count(), 3);
        } else {
          assert.match(await page.locator('#pcHomeBalance').textContent(), mode === 'empty' ? /0\.00/ : /8,150\.00/);
        }
        if (['requests-error', 'isolation'].includes(mode)) {
          assert.equal(await page.locator('#pcHomePending').textContent(), '—');
          assert.match(await page.locator('#pcHomeRequests').textContent(), /unavailable/);
          assert.doesNotMatch(await page.locator('#pcHome').textContent(), /PRIVATE-OTHER-EMPLOYEE/);
        } else if (mode === 'empty') {
          assert.equal(await page.locator('#pcHomePending').textContent(), '0');
          assert.match(await page.locator('#pcHomeRequests').textContent(), /first request/);
        } else {
          assert.equal(await page.locator('#pcHomePending').textContent(), '1');
          assert.equal(await page.locator('#pcHomeRequests tr').count(), 3);
        }
        if (mode === 'employee') {
          await page.addScriptTag({ content: read('pettycash-home.js') });
          assert.equal(calls.length, 2, 'Repeated script must not initialize twice');
          gateReads = true;
          await page.locator('#pcHomeRefresh').click();
          await page.evaluate(() => document.getElementById('pcHomeRefresh').click());
          await page.waitForFunction(() => !document.querySelector('#pcHomeRefresh').disabled);
          assert.equal(calls.length, 4, 'Double click performs one refresh');
          assert.equal(await page.evaluate(() => window.PettyCashModules.pendingPostingKey), null);
          assert.equal(await page.evaluate(() => window.PC_MODULE_CONFIG), undefined, 'Home must not reset or configure Finance posting');
        }
      } else {
        assert.equal(calls.length, 0);
        assert.equal(await page.locator('#pcHomeRefresh').count(), 0);
        assert.equal(await page.locator('#portalUserId').count(), 0);
        assert.match(await page.locator('.pc-home-guest a').getAttribute('href'), /^\/SignIn\?/);
      }
      if (mode === 'fr' || mode === 'it') {
        const link = page.locator('#accessibilityLinkContainer a');
        assert.equal(await link.count(), 1);
        assert.match(await link.getAttribute('rel'), /noopener/);
      }
      assert.equal(await page.locator('#pcSiteHeader img[src="x"], #pcHome img[src="x"]').count(), 0);
      for (const width of [1440, 1200, 1199, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, mode + ': overflow at ' + width);
        if (['employee', 'both', 'anonymous'].includes(mode) && [1440, 390].includes(width)) {
          await page.screenshot({ path: path.join(qa, mode + '-' + width + '.png'), fullPage: true });
        }
      }
      const toggle = page.locator('[data-bs-target="#navbar"]');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#navbar').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, mode + ': open menu overflow');
      if (mode === 'both') await page.screenshot({ path: path.join(qa, 'mobile-menu.png'), fullPage: true });
      await toggle.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
      await page.setViewportSize({ width: 1440, height: 960 });
      assert.equal(await page.locator('#navbar').isVisible(), true);
      if (signedIn) {
        await page.locator('.pc-profile-trigger').click();
        const logout = page.getByRole('link', { name: 'Sign out', exact: true });
        assert.equal(await logout.isVisible(), true);
        assert.match(await logout.getAttribute('href'), /^\/Account\/Login\/LogOff\?returnUrl=/);
      }
      assert.deepEqual(errors, []);
      await page.close(); console.log('Verified shell/home: ' + mode + ', six widths, menu/keyboard/native links; mocked host and APIs only.');
    }
    // Place the same header/footer around each working module to check style and identity isolation.
    for (const [mode, file] of [['new-request', 'New Petty Cash Request.html'], ['requests', 'My Petty Cash Requests.html'],
      ['finance', 'Finance Cash Management.html'], ['admin', 'Admin Users.html']]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      page.setDefaultTimeout(10000);
      const errors = [], calls = [];
      page.on('pageerror', error => errors.push(error.message));
      const partials = require('./shell_fixtures.cjs').includes();
      partials['Petty Cash Admin'] = '<script>' + read('pettycash-admin.js') + '</script>';
      partials['Petty Cash Receipts'] = read('Petty Cash Receipts.html').replace('{% raw %}', '').replace('{% endraw %}', '');
      const scope = require('./shell_fixtures.cjs').context({ finance: true, admin: true });
      const render = require('./liquid_fixture.cjs').render;
      const html = { header: render(read('Header.html'), scope, partials), footer: render(read('Footer.html'), scope, partials), page: render(read(file), scope, partials) };
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        assert.equal(url.origin, 'https://portal.example.test');
        if (url.pathname === '/preview') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + hostCss + '</style></head><body><script>window.shell={getTokenDeferred:async()=>"test-token"};' + bootstrapFixture + '</script>' +
          html.header + '<main id="mainContent">' + html.page + '</main>' + html.footer + '</body></html>' });
        calls.push(request.method()); assert.equal(request.method(), 'GET');
        if (url.pathname === '/_api/hr_cashtransactions') return route.fulfill({ json: { value: [] } });
        if (url.pathname === '/_api/hr_pettycashrequests') return route.fulfill({ json: { value: records } });
        if (url.pathname.startsWith('/_api/contacts(')) return route.fulfill({ json: { contactid: employee,
          _hr_department_value: records[1].hr_pettycashrequestid, _hr_reportstomanager_value: records[2].hr_pettycashrequestid } });
        if (url.pathname === '/_api/contacts') return route.fulfill({ json: { value: [{ contactid: employee, fullname: 'Ayesha Khan', emailaddress1: 'ayesha@example.test', adx_identity_username: 'ayesha', statecode: 0, hr_userrole: 123140002 }] } });
        if (url.pathname === '/_api/hr_departmentses') return route.fulfill({ json: { value: [{ hr_departmentsid: records[1].hr_pettycashrequestid, hr_departmentname: 'Finance', statecode: 0 }] } });
        throw new Error('Unexpected integration URL: ' + url.href);
      });
      await page.goto('https://portal.example.test/preview');
      if (mode === 'new-request') await page.waitForFunction(() => document.getElementById('pcEmployeeBalanceValue').textContent.includes('0.00'));
      if (mode === 'requests') await page.waitForFunction(() => document.getElementById('pcRequestCount').textContent === '3');
      if (mode === 'finance') await page.locator('#pcEmployee option[value="' + employee + '"]').waitFor({ state: 'attached' });
      if (mode === 'admin') await page.waitForFunction(() => !document.getElementById('pcAdminCreate').disabled);
      assert.equal(await page.locator('#portalUserId').count(), 1);
      assert.equal(await page.locator('#pcHome').count(), 0);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, mode + ': module overflow at ' + width);
      }
      assert.deepEqual(errors, []);
      assert.ok(calls.every(method => method === 'GET'));
      await page.close(); console.log('Verified new shell around existing ' + mode + ' page; no writes.');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
