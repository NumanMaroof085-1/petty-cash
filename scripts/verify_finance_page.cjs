// Synthetic local QA only. All data and flow calls are intercepted, never tenant calls.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const employee = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const actor = '33333333-3333-4333-8333-333333333333', flow = '44444444-4444-4444-8444-444444444444';
const transaction = '55555555-5555-4555-8555-555555555555';
const ledgerRow = (employeeId, type, amount, reference = 'CT-TEST') => ({ _hr_employee_value: employeeId,
  _hr_linkedrequest_value: type === 123140001 ? transaction : null, hr_transactiontype: type,
  hr_amount: amount, hr_transactionreference: reference, createdon: '2026-10-29T08:00:00Z', hr_notespurpose: 'Synthetic test movement' });
(async () => {
  const output = path.join(root, 'documentation', 'qa', 'finance'); fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const mode of ['readonly', 'retry', 'posted', 'refresh-failed', 'invalid-refresh', 'employee', 'admin-only', 'accounts-only', 'signed-out', 'bad-ledger', 'race']) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
      const calls = [], errors = [], posted = new Map(); let firstUnconfirmed = false, nextUnconfirmed = false, firstA = true, refreshFailureSent = false;
      let releaseFirst, firstStartedResolve, firstDoneResolve;
      const firstGate = new Promise(resolve => { releaseFirst = resolve; });
      const firstStarted = new Promise(resolve => { firstStartedResolve = resolve; });
      const firstDone = new Promise(resolve => { firstDoneResolve = resolve; });
      const allowed = !['employee', 'admin-only', 'accounts-only', 'signed-out'].includes(mode);
      const configured = mode !== 'readonly';
      const ledgers = new Map([[employee, [ledgerRow(employee, 123140000, 1000), ledgerRow(employee, 123140001, 1200, 'CT-EXPENSE')]],
        [other, [ledgerRow(other, 123140000, 500, 'CT-OTHER')]]]);
      page.on('pageerror', error => errors.push(error.message));
      const context = fs.readFileSync(path.join(root, 'Petty Cash User Context.html'), 'utf8')
        .replace(/\{\{ user.id \| escape \}\}/g, mode === 'signed-out' ? '' : actor)
        .replace(/\{\{ user.fullname \| escape \}\}/g, 'Finance test user')
        .replace(/\{\{ user.emailaddress1 \| escape \}\}/g, 'finance@example.test')
        .replace("{% if user.roles contains 'Petty Cash Accounts' %}true{% else %}false{% endif %}", mode === 'accounts-only' ? 'true' : 'false')
        .replace("{% if user.roles contains 'Petty Cash Finance' %}true{% else %}false{% endif %}", String(allowed))
        .replace("{% if user.roles contains 'Petty Cash Admin' %}true{% else %}false{% endif %}", mode === 'admin-only' ? 'true' : 'false');
      const helper = fs.readFileSync(path.join(root, 'pettycash-modules.js'), 'utf8');
      const fragment = fs.readFileSync(path.join(root, 'Finance Cash Management.html'), 'utf8')
        // Reproduce Studio's independent inline hiding and repeated template include.
        .replace('id="pcFinanceForm" hidden', 'id="pcFinanceForm" hidden style="display:none"')
        .replace('id="pcFinanceHistory"', 'style="display:none" id="pcFinanceHistory"')
        .replace("{% include 'Petty Cash User Context' %}", () => context)
        .replace("{% include 'Petty Cash Modules' %}", () => '<script>window.PC_MODULE_CONFIG={financeFlowId:' + JSON.stringify(configured ? flow : '') +
          ',financeSecurityReviewed:' + configured + '};</script><script>' + helper + '</script><script>' + helper + '</script>');
      assert.doesNotMatch(fragment, /\{%|\{\{/);
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        assert.equal(url.origin, 'https://portal.example.test');
        if (url.pathname === '/preview') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>window.shell={getTokenDeferred:async()=>"mock-token"};</script>' + fragment + '</body></html>' });
        calls.push({ method: request.method(), url: url.href });
        if (url.pathname === '/_api/contacts') return route.fulfill({ json: { value: [
          { contactid: employee, fullname: 'Same name', adx_identity_username: 'employee.one', statecode: 0 },
          { contactid: other, fullname: 'Same name', adx_identity_username: 'employee.two', statecode: 0 }] } });
        if (url.pathname === '/_api/hr_cashtransactions') {
          const id = url.searchParams.get('$filter').split(' ').at(-1);
          if (posted.size && !refreshFailureSent && ['refresh-failed', 'invalid-refresh'].includes(mode)) {
            refreshFailureSent = true;
            return mode === 'refresh-failed'
              ? route.fulfill({ status: 503, json: { error: { message: 'Synthetic ledger refresh failure' } } })
              : route.fulfill({ json: { value: [ledgerRow(id, 99, 100)] } });
          }
          if (mode === 'race' && id === employee) {
            if (firstA) { firstA = false; firstStartedResolve(); await firstGate;
              await route.fulfill({ json: { value: ledgers.get(id) } }); firstDoneResolve(); return; }
            return route.fulfill({ json: { value: [ledgerRow(employee, 123140002, 50)] } });
          }
          return route.fulfill({ json: { value: mode === 'bad-ledger' ? [ledgerRow(other, 123140000, 900)] : ledgers.get(id) } });
        }
        assert.equal(url.pathname, '/_api/cloudflow/v1.0/trigger/' + flow);
        assert.equal(request.method(), 'POST');
        assert.equal(request.headers()['x-requested-with'], 'XMLHttpRequest');
        const input = JSON.parse(new URLSearchParams(request.postData()).get('eventData'));
        if (!posted.has(input.postingKey)) {
          posted.set(input.postingKey, input);
          ledgers.get(input.employeeId).push(ledgerRow(input.employeeId, input.movement === 'cash_given' ? 123140000 : 123140002, input.amount, 'CT-NEW'));
        } else assert.deepEqual(posted.get(input.postingKey), input, 'Retries cannot change an operation');
        if (mode === 'retry' && !firstUnconfirmed) { firstUnconfirmed = true; return route.fulfill({ status: 202, json: {} }); }
        if (mode === 'retry' && posted.size === 2 && !nextUnconfirmed) { nextUnconfirmed = true; return route.fulfill({ status: 202, json: {} }); }
        return route.fulfill({ json: { status: 'posted', postingkey: input.postingKey, employeeid: input.employeeId,
          transactionid: transaction, ...(mode === 'posted' ? {} : { balance: 0 }) } });
      });
      await page.goto('https://portal.example.test/preview');
      await page.waitForFunction(() => !document.querySelector('#pcModuleMessage').textContent.includes('Checking Finance'));
      if (!allowed) {
        assert.equal(await page.locator('#pcFinanceForm').isVisible(), false);
        assert.equal(await page.locator('#pcFinanceHistory').isVisible(), false);
        assert.equal(calls.length, 0, 'Wrong roles must not fetch employee data');
      } else {
        await page.locator('#pcEmployee option').nth(2).waitFor({ state: 'attached' });
        assert.equal(await page.locator('#pcFinanceForm').isVisible(), true);
        assert.equal(await page.locator('#pcFinanceHistory').isVisible(), true);
        assert.equal(calls.filter(call => new URL(call.url).pathname === '/_api/contacts').length, 1,
          'Duplicate helper includes must not initialize the directory twice');
        assert.match(await page.locator('#pcEmployee').textContent(), /employee.one/);
        await page.locator('#pcEmployee').selectOption(employee);
        if (mode === 'race') {
          await firstStarted; await page.locator('#pcEmployee').selectOption(other);
          await page.waitForFunction(() => document.querySelector('#pcEmployeeBalance').textContent.includes('500'));
          await page.locator('#pcEmployee').selectOption(employee);
          await page.waitForFunction(() => document.querySelector('#pcEmployeeBalance').textContent.includes('50'));
          releaseFirst(); await firstDone; await page.evaluate(() => new Promise(requestAnimationFrame));
          assert.match(await page.locator('#pcEmployeeBalance').textContent(), /50/);
        } else if (mode === 'bad-ledger') {
          await page.waitForFunction(() => document.querySelector('#pcEmployeeBalance').textContent === 'Unavailable');
          assert.equal(await page.locator('#pcPostCash').isDisabled(), true);
        } else {
          await page.waitForFunction(() => document.querySelector('#pcEmployeeBalance').textContent.includes('200'));
          if (mode === 'readonly') {
            assert.equal(await page.locator('#pcPostCash').isDisabled(), true);
            assert.equal(await page.locator('#pcCashAmount').isDisabled(), true);
            assert.ok(calls.every(call => call.method === 'GET'));
          } else {
            await page.locator('#pcCashAmount').fill('100'); await page.locator('#pcCashReason').fill('Cash advance');
            assert.match(await page.locator('#pcProjectedBalance').textContent(), /100/);
            assert.equal(await page.locator('#pcPostCash').isDisabled(), true);
            await page.locator('#pcConfirmCash').check();
            await page.screenshot({ path: path.join(output, 'finance-desktop.png'), fullPage: true });
            await page.setViewportSize({ width: 390, height: 844 });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: path.join(output, 'finance-mobile.png'), fullPage: true });
            await page.locator('#pcPostCash').click();
            if (mode !== 'retry') {
              await page.waitForFunction(() => document.querySelector('#pcModuleMessage').textContent.includes('Cash movement recorded') &&
                !document.querySelector('#pcRefreshEmployee').disabled);
              assert.equal(posted.size, 1);
              assert.equal(calls.filter(call => call.method === 'POST').length, 1);
              assert.equal(await page.evaluate(() => window.PettyCashModules.pendingPostingKey), null);
              assert.equal(await page.locator('#pcCashAmount').inputValue(), '');
              assert.equal(await page.locator('#pcConfirmCash').isChecked(), false);
              assert.equal(await page.locator('#pcPostCash').textContent(), 'Record cash movement');
              if (mode === 'posted') {
                assert.match(await page.locator('#pcEmployeeBalance').textContent(), /100/);
                assert.match(await page.locator('#pcModuleMessage').textContent(), /Balance and history refreshed/);
                assert.match(await page.locator('#pcFinanceHistoryBody').textContent(), /CT-NEW/);
              } else {
                assert.equal(await page.locator('#pcEmployeeBalance').textContent(), 'Unavailable');
                assert.match(await page.locator('#pcModuleMessage').textContent(), /movement is already saved/);
                assert.equal(await page.locator('#pcPostCash').isDisabled(), true);
                assert.equal(await page.locator('#pcFinancePostingReference').isVisible(), false);
                await page.addScriptTag({ content: helper });
                assert.match(await page.locator('#pcModuleMessage').textContent(), /movement is already saved/);
                await page.locator('#pcRefreshEmployee').click();
                await page.waitForFunction(() => document.querySelector('#pcModuleMessage').textContent.includes('Balance and history refreshed'));
                assert.match(await page.locator('#pcEmployeeBalance').textContent(), /100/);
                assert.match(await page.locator('#pcFinanceHistoryBody').textContent(), /CT-NEW/);
                assert.equal(calls.filter(call => call.method === 'POST').length, 1, 'Refresh after a saved movement must never repost cash');
              }
              assert.deepEqual(errors, []); await page.close(); console.log('Verified Finance: ' + mode + ' (mock APIs only).');
              continue;
            }
            await page.waitForFunction(() => document.querySelector('#pcPostCash').textContent.includes('Retry same'));
            assert.equal(await page.locator('#pcEmployee').isDisabled(), true);
            assert.equal(await page.locator('#pcCashAmount').isDisabled(), true);
            assert.equal(posted.size, 1);
            const pendingKey = await page.evaluate(() => window.PettyCashModules.pendingPostingKey);
            await page.addScriptTag({ content: helper });
            assert.equal(await page.evaluate(() => window.PettyCashModules.pendingPostingKey), pendingKey,
              'A repeated helper must preserve the unconfirmed posting key');
            await page.locator('#pcRefreshEmployee').click();
            await page.waitForFunction(() => !document.querySelector('#pcRefreshEmployee').disabled);
            assert.equal(await page.locator('#pcProjectedBalance').textContent(), '—', 'Unconfirmed postings must not be projected a second time');
            await page.locator('#pcPostCash').click();
            await page.waitForFunction(() => document.querySelector('#pcModuleMessage').textContent.includes('Balance and history refreshed') &&
              !document.querySelector('#pcRefreshEmployee').disabled);
            assert.match(await page.locator('#pcEmployeeBalance').textContent(), /100/, 'Use the ledger, never the response placeholder zero');
            assert.match(await page.locator('#pcFinanceHistoryBody').textContent(), /CT-NEW/);
            assert.equal(posted.size, 1); assert.equal(calls.filter(call => call.method === 'POST').length, 2);
            assert.equal(await page.locator('#pcCashAmount').inputValue(), '');
            assert.equal(await page.locator('#pcConfirmCash').isChecked(), false);
            await page.locator('#pcMovement').selectOption('cash_returned');
            await page.locator('#pcCashAmount').fill('50'); await page.locator('#pcCashReason').fill('Cash returned');
            assert.match(await page.locator('#pcProjectedBalance').textContent(), /150/);
            await page.locator('#pcConfirmCash').check(); await page.locator('#pcPostCash').click();
            await page.waitForFunction(() => document.querySelector('#pcModuleMessage').textContent.includes('did not confirm'));
            const secondKey = await page.evaluate(() => window.PettyCashModules.pendingPostingKey);
            assert.notEqual(secondKey, pendingKey, 'A separate movement gets a fresh operation key');
            await page.locator('#pcRefreshEmployee').click();
            await page.waitForFunction(() => !document.querySelector('#pcRefreshEmployee').disabled);
            assert.match(await page.locator('#pcModuleMessage').textContent(), /did not confirm/,
              'An earlier saved movement must not make a later pending movement look confirmed');
            assert.equal(await page.evaluate(() => window.PettyCashModules.pendingPostingKey), secondKey);
            await page.locator('#pcPostCash').click();
            await page.waitForFunction(() => document.querySelector('#pcCashAmount').value === '' && document.querySelector('#pcEmployeeBalance').textContent.includes('150'));
            assert.equal(posted.size, 2);
            assert.equal(calls.filter(call => call.method === 'POST').length, 4, 'Each pending movement retries with its own original key');
          }
        }
      }
      assert.deepEqual(errors, []); await page.close(); console.log('Verified Finance: ' + mode + ' (mock APIs only).');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
