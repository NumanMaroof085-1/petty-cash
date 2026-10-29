// Local-only browser QA. All API calls are intercepted; no tenant data is read or written.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const employee = '11111111-1111-4111-8111-111111111111';
const request = '22222222-2222-4222-8222-222222222222';
(async () => {
  const qa = path.join(root, 'documentation', 'qa', 'pages');
  fs.mkdirSync(qa, { recursive: true });
  const browser = await chromium.launch({ headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const mode of ['requests', 'accounts', 'expense-no-manager', 'expense-profile-denied']) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const expense = mode.startsWith('expense-');
      let fragment = fs.readFileSync(path.join(root, expense ? 'New Petty Cash Request.html' :
        mode === 'requests' ? 'My Petty Cash Requests.html' : 'Accounts Cash Management.html'), 'utf8');
      let ledgerReads = 0;
      let profileReads = 0;
      const include = "{% include 'Petty Cash Modules' %}";
      assert.equal(fragment.split(include).length - 1, 1, 'Render the shared template exactly once');
      const contextInclude = "{% include 'Petty Cash User Context' %}";
      assert.equal(fragment.split(contextInclude).length - 1, 1, 'Render the context template exactly once');
      // Simulate signed-in mock Liquid output, not a real authentication engine.
      const contextSource = fs.readFileSync(path.join(root, 'Petty Cash User Context.html'), 'utf8');
      const renderedContext = contextSource.replace(/\{\{ user.id \| escape \}\}/g, employee)
        .replace(/\{\{ user.fullname \| escape \}\}/g, 'Example employee')
        .replace(/\{\{ user.emailaddress1 \| escape \}\}/g, 'employee@example.test')
        .replace("{% if user.roles contains 'Petty Cash Accounts' %}true{% else %}false{% endif %}", 'true')
        .replace("{% if user.roles contains 'Petty Cash Admin' %}true{% else %}false{% endif %}", 'false');
      assert.doesNotMatch(renderedContext, /\{%|\{\{/, 'All mock context values must be rendered');
      // Simulate the documented Liquid include with the canonical local script.
      const moduleSource = fs.readFileSync(path.join(root, 'pettycash-modules.js'), 'utf8');
      assert.doesNotMatch(moduleSource, /<\/script|\{%|\{\{/i, 'Source must be safe to paste into the script template');
      fragment = fragment.replace(contextInclude, () => renderedContext)
        .replace(include, () => '<script>' + moduleSource + '</script>');
      if (expense) fragment = fragment.replace("{% include 'Petty Cash Receipts' %}", () =>
        fs.readFileSync(path.join(root, 'Petty Cash Receipts.html'), 'utf8').replace('{% raw %}', '').replace('{% endraw %}', ''));
      assert.doesNotMatch(fragment, /\{%|\{\{/, 'Mock page must not retain Liquid placeholders');
      await page.route('https://portal.example.test/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/preview') {
          await route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><script>window.shell={getTokenDeferred:async()=>"mock-token"};</script>' + fragment + '</body></html>' });
        } else if (url.pathname === '/_api/hr_cashtransactions') {
          assert.equal(route.request().method(), 'GET');
          assert.equal(url.searchParams.get('$filter'), '_hr_employee_value eq ' + employee);
          ledgerReads++;
          await route.fulfill({ json: { value: [
            { hr_transactiontype: 123140000, hr_amount: 1000, _hr_employee_value: employee },
            { hr_transactiontype: 123140001, hr_amount: 1200, _hr_employee_value: employee, _hr_linkedrequest_value: request }
          ] } });
        } else if (url.pathname === '/_api/hr_pettycashrequests') {
          await route.fulfill({ json: { value: [{ hr_pettycashrequestid: request, hr_requesttitle: 'PCR-20261012-1000',
            hr_transactiondate: '2026-10-12T00:00:00Z', hr_totalamount: 1200, hr_paymentsource: 123140001,
            hr_approvalstatus: 123140001, hr_managercomments: '<img src=x onerror=alert(1)> Approved supplies', _hr_submittedby_value: employee }] } });
        } else if (expense && url.pathname === '/_api/contacts(' + employee + ')') {
          assert.equal(route.request().method(), 'GET');
          profileReads++;
          await route.fulfill(mode === 'expense-profile-denied'
            ? { status: 403, json: { error: { message: 'Contact profile read denied' } } }
            : { json: { _hr_department_value: request, _hr_reportstomanager_value: null } });
        } else if (url.pathname === '/_api/contacts') {
          await route.fulfill({ json: { value: [{ contactid: employee, fullname: 'Example employee', hr_currentbalance: -200 }] } });
        } else throw new Error('Unexpected network request: ' + url.href);
      });
      await page.goto('https://portal.example.test/preview');
      assert.equal(await page.locator('#portalUserId').count(), 1, 'No duplicate identity inputs');
      assert.equal(await page.locator('#pcModuleUserId').inputValue(), employee);
      assert.equal(await page.locator('#portalUserId').inputValue(), employee);
      if (mode === 'requests') {
        await page.getByRole('cell', { name: 'PCR-20261012-1000' }).waitFor();
        assert.match(await page.locator('#pcBalanceMeaning').textContent(), /Company owes/);
        assert.equal(await page.locator('#pcRequestsBody img').count(), 0, 'Comments must be plain text');
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await page.getByRole('cell', { name: 'PCR-20261012-1000' }).waitFor();
      } else if (expense) {
        await page.waitForFunction(() => document.querySelector('#pcEmployeeBalanceValue').textContent.includes('200'));
        assert.match(await page.locator('#pcEmployeeBalanceMeaning').textContent(), /Company owes/);
        assert.equal(profileReads, 1, 'Initialization still checks the submission profile separately');
        await page.locator('#pcEmployeeBalanceRefresh').click();
        await page.waitForFunction(() => !document.querySelector('#pcEmployeeBalanceRefresh').disabled);
        assert.equal(ledgerReads, 2, 'Refresh reads the ledger again');
        assert.equal(profileReads, 1, 'Balance refresh must not retry the missing/inaccessible profile');
        assert.doesNotMatch(await page.locator('#pcEmployeeBalanceValue').textContent(), /Unavailable/);
      } else {
        await page.locator('#pcEmployee option').nth(1).waitFor({ state: 'attached' });
        await page.locator('#pcEmployee').selectOption(employee);
        await page.waitForFunction(() => document.querySelector('#pcEmployeeBalance').textContent.includes('200'));
        assert.equal(await page.locator('#pcPostCash').isDisabled(), true);
      }
      assert.deepEqual(errors, []);
      await page.screenshot({ path: path.join(qa, mode + '-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(qa, mode + '-mobile.png'), fullPage: true });
      await page.close();
      console.log('Verified ' + mode + ' page on desktop and mobile (mock APIs only).');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
