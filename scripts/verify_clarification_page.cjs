// Synthetic browser QA only. All network is intercepted; no tenant flow is called.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const employee = '11111111-1111-4111-8111-111111111111';
const request = '22222222-2222-4222-8222-222222222222';
const clarification = '33333333-3333-4333-8333-333333333333';
const another = '44444444-4444-4444-8444-444444444444';
const processed = '55555555-5555-4555-8555-555555555555';
const flow = '66666666-6666-4666-8666-666666666666';
(async () => {
  const qa = path.join(root, 'documentation', 'qa', 'clarifications'); fs.mkdirSync(qa, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const mode of ['replies', 'denied', 'foreign-link']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
      const errors = [], posts = []; let failFirst = true, deny = mode === 'denied';
      page.on('pageerror', error => errors.push(error.message));
      let html = fs.readFileSync(path.join(root, 'My Petty Cash Requests.html'), 'utf8')
        .replace("{% include 'Petty Cash User Context' %}", () => '<input type="hidden" id="pcModuleUserId" value="' + employee + '">')
        .replace(/clarificationFlowId: "[^"]*"/, 'clarificationFlowId: "' + flow + '"')
        .replace("{% include 'Petty Cash Modules' %}", () => '<script>' + fs.readFileSync(path.join(root, 'pettycash-modules.js'), 'utf8') + '</script>');
      const row = (id, state = 123140000) => ({ hr_requestclarificationid: id, _hr_employee_value: employee,
        _hr_request_value: request, hr_question: 'Explain <img src=x onerror=alert(1)> taxi fare.',
        hr_clarificationreference: 'CL-' + id.slice(0, 4), hr_answer: state === 123140002 ? 'Earlier answer.' : null,
        hr_approvalstage: 123140000, hr_clarificationstatus: state, hr_reviewround: 1 });
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/My-Requests/') {
          await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>window.shell={getTokenDeferred:async()=>"mock-token"};</script>' + html + '</body></html>' });
        } else if (url.pathname === '/_api/hr_cashtransactions') {
          assert.equal(route.request().method(), 'GET'); await route.fulfill({ json: { value: [] } });
        } else if (url.pathname === '/_api/hr_pettycashrequests') {
          assert.equal(route.request().method(), 'GET');
          await route.fulfill({ json: { value: [{ hr_pettycashrequestid: request, _hr_submittedby_value: employee,
            hr_requesttitle: 'PCR-000001', hr_transactiondate: '2026-11-08', hr_totalamount: 1200,
            hr_paymentsource: 123140001, hr_approvalstatus: 123140000 }] } });
        } else if (url.pathname === '/_api/hr_requestclarifications') {
          assert.equal(route.request().method(), 'GET');
          assert.equal(url.searchParams.get('$filter'), '_hr_employee_value eq ' + employee);
          await route.fulfill(deny ? { status: 403, json: { error: { message: 'Clarification read denied.' } } } :
            { json: { value: [row(clarification), row(another), row(processed, 123140002)] } });
        } else if (url.pathname === '/_api/cloudflow/v1.0/trigger/' + flow) {
          assert.equal(route.request().method(), 'POST');
          assert.equal(route.request().headers()['__requestverificationtoken'], 'mock-token');
          assert.equal(route.request().headers()['x-requested-with'], 'XMLHttpRequest');
          const body = JSON.parse(new URLSearchParams(route.request().postData()).get('eventData')); posts.push(body);
          assert.deepEqual(Object.keys(body).sort(), ['answer', 'clarificationId']);
          if (failFirst) { failFirst = false; await route.fulfill({ status: 500, contentType: 'text/html', body: '<html>Error</html>' }); }
          else await route.fulfill({ json: { status: 'answered', clarificationid: clarification, message: 'Answer received.' } });
        } else throw new Error('Unexpected network request: ' + url.href);
      });
      await page.goto('https://portal.example.test/My-Requests/?clarificationId=' + (mode === 'foreign-link' ? request : clarification));
      await page.getByRole('cell', { name: 'PCR-000001', exact: true }).waitFor();
      if (deny) {
        await page.getByText('Clarification read denied.', { exact: true }).waitFor();
        assert.match(await page.locator('#pcBalance').textContent(), /0/);
        assert.equal(posts.length, 0);
        deny = false; await page.getByRole('button', { name: 'Refresh questions', exact: true }).click();
      }
      const answer = page.locator('#pcClarificationAnswer-' + clarification);
      await answer.waitFor();
      assert.equal(await page.locator('#pcClarifications img').count(), 0, 'Question must render as plain text');
      assert.equal(await page.locator('#pcClarificationHistory textarea').count(), 0, 'Processed answers are read-only');
      if (mode === 'foreign-link') {
        assert.match(await page.locator('#pcClarificationMessage').textContent(), /not available for this account/);
        assert.equal(posts.length, 0);
      } else {
        await answer.fill('Taxi for a site visit.');
        await page.getByRole('button', { name: 'Refresh questions', exact: true }).click();
        await page.waitForFunction(() => !document.getElementById('pcClarificationRefresh').disabled);
        assert.equal(await answer.inputValue(), 'Taxi for a site visit.', 'Refresh preserves draft text');
        await page.locator('#pcClarification-' + clarification).getByRole('button', { name: 'Send answer', exact: true }).click();
        await page.getByRole('button', { name: 'Retry same answer', exact: true }).waitFor();
        assert.equal(await answer.isDisabled(), true);
        assert.equal(await page.locator('#pcClarification-' + another).getByRole('button').isDisabled(), true);
        await page.getByRole('button', { name: 'Retry same answer', exact: true }).click();
        await page.getByText('Answer received.', { exact: true }).waitFor();
        assert.equal(await page.locator('#pcClarificationAnswer-' + clarification).count(), 0);
        assert.deepEqual(posts[0], posts[1], 'Retry uses the exact same question and answer');
        await page.getByRole('button', { name: 'Refresh questions', exact: true }).click();
        await page.waitForFunction(() => !document.getElementById('pcClarificationRefresh').disabled);
        assert.equal(await page.locator('#pcClarificationAnswer-' + clarification).count(), 0, 'A stale read cannot reopen a confirmed answer');
      }
      await page.screenshot({ path: path.join(qa, mode + '-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(qa, mode + '-mobile.png'), fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No mobile horizontal overflow');
      assert.deepEqual(errors, []);
      await page.close(); console.log('Verified clarification ' + mode + ' (mock APIs only).');
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
