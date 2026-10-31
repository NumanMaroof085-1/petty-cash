// Page-design QA with synthetic data. No live portal access; no real cash/profile writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const actor = '11111111-1111-4111-8111-111111111111';
const employee = '22222222-2222-4222-8222-222222222222';
const department = '33333333-3333-4333-8333-333333333333';
const manager = '44444444-4444-4444-8444-444444444444';
const flow = '55555555-5555-4555-8555-555555555555';
const makeRequest = (index, status, title, comments, amount) => ({
  hr_pettycashrequestid: '66666666-6666-4666-8666-' + String(index).padStart(12, '0'),
  hr_requesttitle: title, hr_approvalstatus: status, hr_totalamount: amount,
  hr_transactiondate: '2026-10-' + String(20 + index).padStart(2, '0') + 'T00:00:00Z',
  hr_paymentsource: index === 1 ? 123140001 : 123140000,
  hr_managercomments: comments, _hr_submittedby_value: actor
});
const requests = [makeRequest(1, 123140000, 'PCR-000128', '', 2400),
  makeRequest(2, 123140001, 'PCR-000127', 'Approved. Thank you for the receipts.', 1850),
  makeRequest(3, 123140002, 'PCR-000126', 'Please add a clear receipt for the taxi.', 650)];
(async () => {
  const output = path.join(root, 'documentation', 'qa', 'ui'); fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const [mode, file] of [['request', 'New Petty Cash Request.html'], ['requests', 'My Petty Cash Requests.html'],
      ['finance', 'Finance Cash Management.html'], ['admin', 'Admin Users.html']]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const calls = [], errors = []; let failRequests = false, emptyRequests = false, literalComments = false;
      page.on('pageerror', error => errors.push(error.message));
      const context = fs.readFileSync(path.join(root, 'Petty Cash User Context.html'), 'utf8')
        .replace(/\{\{ user.id \| escape \}\}/g, actor)
        .replace(/\{\{ user.fullname \| escape \}\}/g, 'Ayesha Khan')
        .replace(/\{\{ user.emailaddress1 \| escape \}\}/g, 'ayesha@example.test')
        .replace(/\{% if user.roles contains '[^']+' %\}true\{% else %\}false\{% endif %\}/g, 'true');
      let fragment = fs.readFileSync(path.join(root, file), 'utf8')
        .replace("{% include 'Petty Cash User Context' %}", () => context)
        .replace("{% include 'Petty Cash Modules' %}", () =>
          '<script>window.PC_MODULE_CONFIG={financeFlowId:' + JSON.stringify(flow) + ',financeSecurityReviewed:true};</script><script>' +
          fs.readFileSync(path.join(root, 'pettycash-modules.js'), 'utf8') + '</script>')
        .replace("{% include 'Petty Cash Admin' %}", () => '<script>' + fs.readFileSync(path.join(root, 'pettycash-admin.js'), 'utf8') + '</script>')
        .replace("{% include 'Petty Cash Receipts' %}", () => fs.readFileSync(path.join(root, 'Petty Cash Receipts.html'), 'utf8')
          .replace('{% raw %}', '').replace('{% endraw %}', ''));
      // Reproduce old Studio inline form hiding without allowing it to hide authorized forms.
      fragment = fragment.replace('id="pcAdminForm" hidden', 'id="pcAdminForm" hidden style="display:none"');
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        assert.equal(url.origin, 'https://portal.example.test', 'No new external assets or APIs');
        if (url.pathname === '/preview') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          // Common host styles plus an outside control prove the page styles stay scoped.
          '<style>body{margin:0;font-family:Arial}button{border-radius:0;background:rgb(180,0,0)}.form-control{height:34px}.page-header{border-bottom:1px solid red}</style></head><body>' +
          '<div id="hostSample"><button>Host control</button></div><script>window.shell={getTokenDeferred:async()=>"test-token"};</script>' + fragment + '</body></html>' });
        calls.push({ method: request.method(), path: url.pathname });
        assert.equal(request.method(), 'GET', 'Design QA must never submit a record');
        if (url.pathname === '/_api/hr_cashtransactions') {
          const id = url.searchParams.get('$filter').split(' ').at(-1);
          return route.fulfill({ json: { value: [
            { hr_transactiontype: 123140000, hr_amount: 10000, _hr_employee_value: id, hr_transactionreference: 'CT-000152', hr_notespurpose: 'Cash advance for office supplies', createdon: '2026-10-30T12:00:00Z' },
            { hr_transactiontype: 123140001, hr_amount: 1850, _hr_employee_value: id, _hr_linkedrequest_value: requests[1].hr_pettycashrequestid,
              hr_transactionreference: 'CT-000153', hr_notespurpose: 'Office supplies', createdon: '2026-10-31T08:00:00Z' }
          ] } });
        }
        if (url.pathname === '/_api/hr_pettycashrequests') {
          if (failRequests) return route.fulfill({ status: 503, json: { error: { message: 'Request history is temporarily unavailable.' } } });
          return route.fulfill({ json: { value: emptyRequests ? [] : requests.map((r, i) =>
            literalComments && i === 1 ? { ...r, hr_managercomments: '<img src=x onerror=alert(1)> literal comment' } : r) } });
        }
        if (url.pathname === '/_api/contacts') return route.fulfill({ json: { value: [
          { contactid: employee, fullname: 'Hamza Ali', emailaddress1: 'hamza@example.test', adx_identity_username: 'hamza.ali', hr_userrole: 123140000, statecode: 0 },
          { contactid: manager, fullname: 'Sara Ahmed', emailaddress1: 'sara@example.test', adx_identity_username: 'sara.ahmed', hr_userrole: 123140001, statecode: 0 },
          { contactid: actor, fullname: 'Ayesha Khan', emailaddress1: 'ayesha@example.test', adx_identity_username: 'ayesha.khan', hr_userrole: 123140002, statecode: 0 }
        ] } });
        if (url.pathname.startsWith('/_api/contacts(')) return route.fulfill({ json: { contactid: actor, _hr_department_value: department, _hr_reportstomanager_value: manager } });
        if (url.pathname === '/_api/hr_departmentses') return route.fulfill({ json: { value: [{ hr_departmentsid: department, hr_departmentname: 'Operations', statecode: 0 }] } });
        if (url.pathname.startsWith('/_api/hr_departmentses(')) return route.fulfill({ json: { hr_departmentname: 'Operations' } });
        throw new Error('Unexpected URL: ' + url.href);
      });
      await page.goto('https://portal.example.test/preview');
      if (mode === 'request') {
        await page.waitForFunction(() => document.querySelector('#pcEmployeeBalanceValue').textContent.includes('8,150'));
        await page.getByRole('button', { name: 'Use suggested item Petrol', exact: true }).click();
        await page.locator('.qty-input').fill('2'); await page.locator('.price-input').fill('350');
        await page.getByRole('button', { name: 'Use suggested item Hotel', exact: true }).click();
        await page.locator('.price-input').nth(1).fill('1700');
        assert.equal(await page.locator('#lblGrandTotal').textContent(), '2400.00');
        await page.locator('#txtJustification').fill('Travel and accommodation for the client site visit.');
        assert.ok(await page.locator('#txtJustification').evaluate(el => el.getBoundingClientRect().height) >= 108,
          'Host form-control height must not collapse the purpose field');
      } else if (mode === 'finance') {
        await page.locator('#pcEmployee option[value="' + employee + '"]').waitFor({ state: 'attached' });
        await page.locator('#pcEmployee').selectOption(employee);
        await page.waitForFunction(() => !document.querySelector('#pcCashAmount').disabled);
        await page.locator('#pcCashAmount').fill('2000'); await page.locator('#pcCashReason').fill('Cash advance for site visit');
        assert.match(await page.locator('#pcProjectedBalance').textContent(), /10,150/);
      } else if (mode === 'admin') {
        await page.waitForFunction(() => !document.querySelector('#pcAdminCreate').disabled);
        assert.equal(await page.locator('#pcAdminForm').isVisible(), true);
        await page.locator('#pcAdminFirstName').fill('Hamza'); await page.locator('#pcAdminLastName').fill('Ali');
        await page.locator('#pcAdminEmail').fill('hamza@example.test'); await page.locator('#pcAdminUsername').fill('hamza.ali');
        await page.locator('#pcAdminDepartment').selectOption(department); await page.locator('#pcAdminManager').selectOption(manager);
      } else {
        await page.waitForFunction(() => document.querySelector('#pcRequestCount').textContent === '3');
        assert.equal(await page.locator('#pcPendingCount').textContent(), '1');
        assert.equal(await page.locator('#pcApprovedCount').textContent(), '1');
        assert.equal(await page.locator('#pcRequestsBody .pc-status').count(), 3);
        const before = calls.length;
        await page.locator('#pcRequestSearch').fill('CLEAR RECEIPT');
        assert.equal(await page.locator('#pcRequestResults').textContent(), '1 of 3 requests');
        assert.match(await page.locator('#pcRequestsBody').textContent(), /PCR-000126/);
        await page.locator('#pcRequestStatus').selectOption('Approved');
        assert.match(await page.locator('#pcRequestsBody').textContent(), /No requests match/);
        await page.locator('#pcRequestSearch').fill('');
        assert.match(await page.locator('#pcRequestsBody').textContent(), /PCR-000127/);
        assert.equal(calls.length, before, 'Search/filter must be local and read-only');
        await page.locator('#pcRefresh').click();
        await page.waitForFunction(() => !document.querySelector('#pcRefresh').disabled);
        assert.equal(await page.locator('#pcRequestStatus').inputValue(), 'Approved');
        assert.equal(await page.locator('#pcRequestResults').textContent(), '1 of 3 requests');
        await page.locator('#pcRequestStatus').selectOption('');
      }
      assert.equal(await page.locator('#hostSample button').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(180, 0, 0)');
      assert.equal(await page.locator('#hostSample button').evaluate(el => getComputedStyle(el).borderRadius), '0px');
      await page.locator('#hostSample').evaluate(el => el.style.display = 'none');
      await page.locator('.pc-app h2').click();
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 960 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, mode + ' overflows at ' + width);
        if (width <= 390 && ['requests', 'finance'].includes(mode)) {
          const selector = mode === 'requests' ? '#pcRequestsBody tr:first-child td:nth-child(5)' : '#pcFinanceHistoryBody tr:first-child td:nth-child(4)';
          assert.equal(await page.locator(selector).evaluate(el => {
            const bounds = el.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth;
          }), true, mode + ' key status/amount must be visible without scrolling sideways');
        }
        const controls = page.locator('.pc-app input:not([type=hidden]), .pc-app select, .pc-app textarea');
        for (const control of await controls.all()) {
          if (!await control.isVisible()) continue;
          const named = await control.evaluate(el => Boolean(el.getAttribute('aria-label') || el.labels?.length));
          assert.equal(named, true, mode + ' has an unlabeled visible control');
        }
        if (width === 1440 || width === 390) await page.screenshot({ path: path.join(output, mode + (width === 1440 ? '-desktop' : '-mobile') + '.png'), fullPage: true });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const button = page.locator('.pc-app button:visible').first();
      await page.keyboard.press('Tab');
      await button.focus();
      assert.equal(await button.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
      assert.equal(await button.evaluate(el => getComputedStyle(el).transitionDuration), '0s');
      if (mode === 'requests') {
        literalComments = true; await page.locator('#pcRefresh').click();
        await page.waitForFunction(() => !document.querySelector('#pcRefresh').disabled);
        assert.equal(await page.locator('#pcRequestsBody img').count(), 0);
        assert.match(await page.locator('#pcRequestsBody').textContent(), /<img src=x/);
        emptyRequests = true; await page.locator('#pcRefresh').click();
        await page.waitForFunction(() => document.querySelector('#pcRequestCount').textContent === '0');
        assert.match(await page.locator('#pcRequestsBody').textContent(), /No requests yet/);
        failRequests = true; await page.locator('#pcRefresh').click();
        await page.waitForFunction(() => !document.querySelector('#pcRefresh').disabled);
        assert.match(await page.locator('#pcModuleMessage').textContent(), /temporarily unavailable/);
        assert.equal(await page.locator('#pcRequestSearch').isDisabled(), true);
        assert.equal(await page.locator('#pcRequestCount').textContent(), '—');
        failRequests = false; emptyRequests = false; await page.locator('#pcRefresh').click();
        await page.waitForFunction(() => document.querySelector('#pcRequestCount').textContent === '3');
        assert.equal(await page.locator('#pcRequestSearch').isDisabled(), false);
      }
      assert.deepEqual(errors, []);
      await page.close(); console.log('Verified redesigned ' + mode + ': 1440/768/390/320px, scoped styles and named controls.');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
