// Local UI/integration QA only: synthetic employees/receipts, all API calls mocked.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const root = path.resolve(__dirname, '..');
const employee = '11111111-1111-4111-8111-111111111111';
const department = '22222222-2222-4222-8222-222222222222';
const manager = '33333333-3333-4333-8333-333333333333';
(async () => {
  const qa = path.join(root, 'documentation', 'qa', 'suggestions');
  fs.mkdirSync(qa, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    async function open(mode) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      const writes = [], errors = [], records = new Map(); let sequence = 0, uploadFailed = false;
      page.on('pageerror', error => errors.push(error.message));
      const receipt = fs.readFileSync(path.join(root, 'Petty Cash Receipts.html'), 'utf8')
        .replace('{% raw %}', '').replace('{% endraw %}', '');
      const fragment = fs.readFileSync(path.join(root, 'New Petty Cash Request.html'), 'utf8')
        .replace("{% include 'Petty Cash User Context' %}", '<input type="hidden" id="portalUserId" value="' + employee + '">')
        .replace("{% include 'Petty Cash Modules' %}", '<script>window.PettyCashModules={readBalance:async()=>0,money:()=>"Rs 0.00",balanceMeaning:()=>"Settled"};</script>')
        .replace("{% include 'Petty Cash Receipts' %}", () => receipt);
      assert.doesNotMatch(fragment, /\{%|\{\{/);
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        assert.equal(url.origin, 'https://portal.example.test', 'No external suggestion lookup/service');
        if (url.pathname === '/preview') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
          '<script>window.shell={getTokenDeferred:async()=>"mock-token"};</script>' + fragment + '</body></html>' });
        if (method === 'POST') {
          const body = request.postDataJSON(), set = url.pathname.slice('/_api/'.length);
          writes.push({ method, body, set });
          if (mode === 'uncertain' || mode === 'definite') return route.fulfill({ status: mode === 'uncertain' ? 500 : 403,
            json: { error: { message: 'Synthetic create rejection' } } });
          const id = '44444444-4444-4444-8444-' + String(++sequence).padStart(12, '0');
          const record = {};
          for (const [key, value] of Object.entries(body)) {
            const navigation = { hr_SubmittedBy: '_hr_submittedby_value', hr_Department: '_hr_department_value',
              hr_AssignedManager: '_hr_assignedmanager_value', hr_ParentRequest: '_hr_parentrequest_value' };
            if (key.endsWith('@odata.bind')) record[navigation[key.replace('@odata.bind', '')]] = value.match(/\(([^)]+)\)/)[1];
            else record[key] = value;
          }
          record[set === 'hr_pettycashrequests' ? 'hr_pettycashrequestid' : 'hr_pettycashlineitemid'] = id;
          records.set(id, record); return route.fulfill({ status: 204, headers: { entityid: id }, body: '' });
        }
        if (method === 'PUT') {
          writes.push({ method });
          if (mode === 'retry' && !uploadFailed) {
            uploadFailed = true; return route.fulfill({ status: 500, json: { error: { message: 'Synthetic upload interruption' } } });
          }
          return route.fulfill({ status: 204, body: '' });
        }
        assert.equal(method, 'GET');
        if (url.pathname.startsWith('/_api/contacts(')) return route.fulfill({ json: { _hr_department_value: department, _hr_reportstomanager_value: manager } });
        if (url.pathname.startsWith('/_api/hr_departmentses(')) return route.fulfill({ json: { hr_departmentname: 'Finance' } });
        const match = url.pathname.match(/\(([^)]+)\)$/);
        return route.fulfill({ json: match ? records.get(match[1]) : { value: [] } });
      });
      await page.goto('https://portal.example.test/preview');
      await page.getByRole('button', { name: 'Use suggested item Petrol', exact: true }).waitFor();
      return { page, writes, errors };
    }
    const ui = await open('ui'), page = ui.page;
    const use = name => page.getByRole('button', { name: 'Use suggested item ' + name, exact: true });
    const rows = page.locator('#tableBody tr');
    await use('Petrol').click();
    assert.equal(await rows.count(), 1);
    assert.equal(await rows.nth(0).locator('.name-input').inputValue(), 'Petrol');
    assert.equal(await rows.nth(0).locator('.qty-input').evaluate(node => node === document.activeElement), true);
    await rows.nth(0).locator('.qty-input').fill('2'); await rows.nth(0).locator('.price-input').fill('100');
    await use('Petrol').click();
    assert.equal(await rows.count(), 1); assert.equal(await rows.nth(0).locator('.qty-input').inputValue(), '2');
    assert.equal(await rows.nth(0).locator('.price-input').inputValue(), '100');
    await use('Hotel').focus(); await use('Hotel').press('Enter');
    assert.equal(await rows.count(), 2); await rows.nth(1).locator('.price-input').fill('400');
    await page.locator('#selCategory').selectOption('Kitchen/Food');
    assert.equal(await rows.nth(0).locator('.name-input').inputValue(), 'Petrol');
    await use('Chicken').click();
    await rows.nth(2).locator('.name-input').fill('Chicken breast');
    await rows.nth(2).locator('.price-input').fill('200');
    await use('Chicken').click();
    assert.equal(await rows.count(), 4); assert.equal(await rows.nth(2).locator('.name-input').inputValue(), 'Chicken breast');
    await rows.nth(3).locator('.price-input').fill('250');
    await use('Chicken').click(); assert.equal(await rows.count(), 4);
    await page.locator('#btnAddItem').click(); await use('Naan').click();
    assert.equal(await rows.count(), 5); assert.equal(await rows.nth(4).locator('.name-input').inputValue(), 'Naan');
    await page.locator('#btnAddItem').click(); await rows.nth(5).locator('.qty-input').fill('5');
    await use('Eggs').click();
    assert.equal(await rows.count(), 7); assert.equal(await rows.nth(5).locator('.name-input').inputValue(), '');
    assert.equal(await rows.nth(5).locator('.qty-input').inputValue(), '5');
    assert.equal(await rows.nth(6).locator('.name-input').inputValue(), 'Eggs');
    assert.equal(await page.locator('#lblGrandTotal').textContent(), '1050.00');
    await page.locator('#pcSuggestionCard').screenshot({ path: path.join(qa, 'card-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#pcSuggestionCard').screenshot({ path: path.join(qa, 'card-mobile.png') });
    await page.evaluate('DATAVERSE_CONFIG.itemSuggestions["Kitchen/Food"].push("<img src=x onerror=window.badSuggestion=true>"); toggleOtherCategory()');
    const literal = '<img src=x onerror=window.badSuggestion=true>';
    await use(literal).click();
    assert.equal(await page.locator('#pcSuggestionCard img').count(), 0);
    assert.equal(await page.evaluate(() => window.badSuggestion), undefined);
    assert.equal(await rows.last().locator('.name-input').inputValue(), literal);
    await page.locator('#selCategory').selectOption('Others');
    assert.equal(await page.locator('#pcSuggestionItems button').count(), 0);
    assert.equal(await page.locator('#otherCategoryGroup').isVisible(), true);
    assert.match(await page.locator('#pcSuggestionStatus').textContent(), /manually/);
    assert.equal(ui.writes.length, 0); assert.deepEqual(ui.errors, []); await page.close();

    for (const mode of ['retry', 'uncertain', 'definite']) {
      const h = await open(mode), page = h.page;
      await page.locator('#selCategory').selectOption('Kitchen/Food');
      await page.getByRole('button', { name: 'Use suggested item Chicken', exact: true }).click();
      await page.locator('#tableBody tr').nth(0).locator('.qty-input').fill('2');
      await page.locator('#tableBody tr').nth(0).locator('.price-input').fill('100');
      await page.getByRole('button', { name: 'Use suggested item Naan', exact: true }).click();
      await page.locator('#tableBody tr').nth(1).locator('.qty-input').fill('3');
      await page.locator('#tableBody tr').nth(1).locator('.price-input').fill('20');
      await page.locator('#txtJustification').fill('Synthetic kitchen suggestion test');
      // Header-only PDF fixture is intentionally synthetic; no PDF artifact is authored/delivered.
      await page.locator('#fileReceipt').setInputFiles({ name: 'synthetic.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nfixture') });
      await page.locator('#btnSubmit').click();
      await page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Error:'));
      const locked = mode !== 'definite';
      assert.equal(await page.locator('#pcSuggestionItems button:disabled').count(), locked ? 3 : 0);
      if (locked) {
        await page.evaluate(() => window.addSuggestedItem('Eggs'));
        assert.equal(await page.locator('#tableBody tr').count(), 2);
        await page.locator('#selCategory').selectOption('Travel');
        assert.equal(await page.locator('#pcSuggestionItems button:disabled').count(), 3);
        await page.locator('#selCategory').selectOption('Kitchen/Food');
      }
      if (mode === 'retry') {
        await page.locator('#btnSubmit').click();
        await page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Success!'));
        assert.equal(h.writes.filter(write => write.method === 'POST').length, 3);
        const products = h.writes.filter(write => write.method === 'POST' && write.set === 'hr_pettycashlineitems');
        assert.deepEqual(products.map(write => [write.body.hr_itemname, write.body.hr_quantity, write.body.hr_unitprice, write.body.hr_totalprice, write.body.hr_category]),
          [['Chicken', 2, 100, 200, 123140001], ['Naan', 3, 20, 60, 123140001]]);
        assert.equal(h.writes.filter(write => write.method === 'PUT').length, 2);
        assert.equal(await page.locator('#selCategory').inputValue(), 'Travel');
        assert.equal(await page.locator('#pcSuggestionCategory').textContent(), 'Travel');
        assert.equal(await page.locator('#pcSuggestionItems button:disabled').count(), 0);
        assert.equal(await page.locator('#tableBody tr').count(), 1);
      } else if (mode === 'uncertain') {
        await page.locator('#btnSubmit').click();
        assert.equal(h.writes.filter(write => write.method === 'POST').length, 1);
      }
      assert.deepEqual(h.errors, []); await page.close();
    }
    console.log('Verified suggestions: blank reuse, append, repeat focus, manual-edit preservation, category/Other behavior, keyboard and mobile UI, literal labels, save payload, partial retry/uncertain locks, definite-error unlock and success reset. Mock APIs only.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
