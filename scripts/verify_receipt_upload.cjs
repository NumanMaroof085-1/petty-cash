// End-to-end local QA. Synthetic receipts; every network request is intercepted.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const runtimeRequire = createRequire('C:/Users/numan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = runtimeRequire('playwright');
const sharp = runtimeRequire('sharp');
const { PDFDocument } = runtimeRequire('pdf-lib');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp', 'pdfs');
const employee = '11111111-1111-4111-8111-111111111111';
const department = '22222222-2222-4222-8222-222222222222';
const manager = '33333333-3333-4333-8333-333333333333';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function receipt(name, width, height, color, jpeg = false, orientation) {
  const text = Array.from({ length: height > 2000 ? 35 : 8 }, (_, i) =>
    '<text x="45" y="' + (200 + i * 65) + '" font-size="30">Item ' + (i + 1) + ' ........ PKR 100.00</text>').join('');
  const svgWidth = orientation === 6 ? height : width, svgHeight = orientation === 6 ? width : height;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '">' +
    '<rect width="100%" height="100%" fill="' + color + '"/><g fill="#111827" font-family="Arial">' +
    '<text x="45" y="90" font-size="42">' + name + '</text><text x="45" y="140" font-size="28">Synthetic receipt - QA only</text>' + text + '</g></svg>';
  let image = sharp(Buffer.from(svg));
  if (orientation) image = image.rotate(270).withMetadata({ orientation });
  return { name: name + (jpeg ? '.jpg' : '.png'), mimeType: jpeg ? 'image/jpeg' : 'image/png',
    buffer: await (jpeg ? image.jpeg({ quality: 94 }) : image.png()).toBuffer() };
}
async function renderPdf(bytes) {
  const canvasLib = runtimeRequire('@napi-rs/canvas');
  for (const key of ['DOMMatrix', 'ImageData', 'Path2D']) global[key] = canvasLib[key];
  const pdfjs = await import(pathToFileURL(runtimeRequire.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useSystemFonts: true }).promise;
  assert.equal(document.numPages, 4);
  for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i), viewport = page.getViewport({ scale: 0.85 });
    const canvas = canvasLib.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
    const png = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(output, 'receipt-page-' + i + '.png'), png);
    const stats = await sharp(png).stats();
    if (i === 1) assert.ok(stats.channels[1].mean > stats.channels[0].mean, 'First image must be green Receipt B after reordering');
    if (i === 2) assert.ok(stats.channels[0].mean > stats.channels[1].mean, 'Second image must be red Receipt A');
  }
  await document.destroy();
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const fixtures = [await receipt('RECEIPT A', 1000, 1500, '#fee2e2'),
    await receipt('RECEIPT B', 1600, 1000, '#dcfce7', true),
    await receipt('LONG RECEIPT', 600, 3000, '#dbeafe'),
    await receipt('ROTATION TEST', 1200, 700, '#fef3c7', true, 6)];
  let receiptTemplate = fs.readFileSync(path.join(root, 'Petty Cash Receipts.html'), 'utf8')
    .replace('{% raw %}', '').replace('{% endraw %}', '');
  let sample;
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    async function open(mode) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      const calls = [], writes = [], records = new Map(), errors = []; let seq = 0, rejectedUpload = false;
      page.on('pageerror', error => errors.push(error.message));
      let fragment = fs.readFileSync(path.join(root, 'New Petty Cash Request.html'), 'utf8')
        .replace("{% include 'Petty Cash User Context' %}", '<input id="portalUserId" value="' + employee + '" hidden>')
        .replace("{% include 'Petty Cash Modules' %}", '<script>window.PettyCashModules={readBalance:async()=>0,money:()=>"Rs 0.00",balanceMeaning:()=>"Settled"};</script>')
        .replace("{% include 'Petty Cash Receipts' %}", () => receiptTemplate);
      assert.doesNotMatch(fragment, /\{%|\{\{/);
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        assert.equal(url.origin, 'https://portal.example.test', 'No external services/CDNs/original-image uploads');
        if (url.pathname === '/preview') return route.fulfill({ contentType: 'text/html; charset=utf-8', body:
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
          '<script>window.shell={getTokenDeferred:async()=>"mock-token"};window.define=()=>{throw new Error("Receipt bundle must not consume host AMD globals")};window.define.amd={};</script>' + fragment + '</body></html>' });
        calls.push({ method, url: url.href });
        if (method === 'POST') {
          const body = request.postDataJSON();
          const set = url.pathname.slice('/_api/'.length);
          const id = '44444444-4444-4444-8444-' + String(++seq).padStart(12, '0');
          const record = {};
          for (const [key, value] of Object.entries(body)) {
            const lookups = { hr_SubmittedBy: '_hr_submittedby_value', hr_Department: '_hr_department_value', hr_AssignedManager: '_hr_assignedmanager_value', hr_ParentRequest: '_hr_parentrequest_value' };
            if (key.endsWith('@odata.bind')) record[lookups[key.replace('@odata.bind', '')]] = value.match(/\(([^)]+)\)/)[1];
            else record[key] = value;
          }
          record[set === 'hr_pettycashrequests' ? 'hr_pettycashrequestid' : 'hr_pettycashlineitemid'] = id;
          records.set(id, record); writes.push({ method, set, body });
          return route.fulfill({ status: 204, headers: { entityid: id }, body: '' });
        }
        if (method === 'PUT') {
          const bytes = request.postDataBuffer();
          assert.ok(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')));
          writes.push({ method, bytes, hash: digest(bytes) });
          if (mode === 'retry' && !rejectedUpload) { rejectedUpload = true; return route.fulfill({ status: 500, json: { error: { message: 'Synthetic upload interruption' } } }); }
          return route.fulfill({ status: 204, body: '' });
        }
        assert.equal(method, 'GET');
        if (url.pathname.startsWith('/_api/contacts(')) return route.fulfill({ json: { _hr_department_value: department, _hr_reportstomanager_value: manager } });
        if (url.pathname.startsWith('/_api/hr_departmentses(')) return route.fulfill({ json: { hr_departmentname: 'Finance' } });
        const id = url.pathname.match(/\(([^)]+)\)$/);
        return route.fulfill({ json: id ? records.get(id[1]) : { value: [] } });
      });
      await page.goto('https://portal.example.test/preview');
      await page.evaluate(() => {
        window.pdfGenerations = 0;
        const Original = window.jspdf.jsPDF;
        window.jspdf.jsPDF = function (...args) { window.pdfGenerations++; return new Original(...args); };
      });
      await page.locator('.name-input').fill('Office supplies');
      await page.locator('.price-input').fill('250');
      await page.locator('#txtJustification').fill('Synthetic receipt upload test');
      return { page, calls, writes, errors };
    }
    const h = await open('retry'), page = h.page;
    await page.locator('#fileReceipt').setInputFiles(fixtures);
    assert.equal(await page.locator('#pcReceiptList li').count(), 4);
    await page.getByRole('button', { name: 'Move image 2 up', exact: true }).click();
    await page.getByRole('button', { name: 'Prepare PDF', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#pcReceiptStatus').textContent.includes('PDF ready:'));
    assert.equal(h.writes.length, 0, 'Preview must not create Dataverse records');
    sample = Buffer.from(await page.evaluate(async () => Array.from(new Uint8Array(await
      (await window.PettyCashReceipts.current.prepare(window.PettyCashReceipts.current.snapshot())).arrayBuffer()))));
    const parsed = await PDFDocument.load(sample);
    assert.equal(parsed.getPageCount(), 4);
    const sizes = parsed.getPages().map(page => page.getSize());
    assert.ok(sizes[0].width > sizes[0].height);
    assert.ok(sizes[2].height > 2.2 * sizes[2].width, 'Long receipt must have a tall page');
    assert.ok(sizes[3].height > sizes[3].width, 'EXIF rotation must produce a portrait image');
    fs.writeFileSync(path.join(output, 'receipt-preview.pdf'), sample);
    await page.locator('#pcReceiptArea').screenshot({ path: path.join(output, 'picker-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#pcReceiptArea').screenshot({ path: path.join(output, 'picker-mobile.png') });
    await page.locator('#btnSubmit').click();
    await page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Synthetic upload interruption'));
    assert.equal(await page.locator('#fileReceipt').isDisabled(), true);
    await page.locator('#btnSubmit').click();
    await page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Success!'));
    const uploads = h.writes.filter(call => call.method === 'PUT');
    assert.equal(uploads.length, 2); assert.equal(uploads[0].hash, uploads[1].hash);
    assert.equal(uploads[0].hash, digest(sample));
    assert.equal(h.writes.filter(call => call.method === 'POST').length, 2, 'Exactly one header and one line');
    assert.equal(await page.evaluate(() => window.pdfGenerations), 1, 'Preview, upload and retry must reuse one generated PDF');
    assert.equal(await page.locator('#pcReceiptList li').count(), 0);
    assert.equal(await page.locator('#fileReceipt').isDisabled(), false);
    assert.deepEqual(h.errors, []); await page.close();

    const existing = await open('existing');
    await existing.page.evaluate(() => { window.jspdf = undefined; });
    await existing.page.locator('#fileReceipt').setInputFiles({ name: 'original.pdf', mimeType: 'application/pdf', buffer: sample });
    await existing.page.locator('#btnSubmit').click();
    await existing.page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Success!'));
    assert.equal(existing.writes.find(call => call.method === 'PUT').hash, digest(sample));
    assert.deepEqual(existing.errors, []); await existing.page.close();

    for (const mode of ['corrupt', 'heic', 'mixed', 'too-many', 'encode-failure']) {
      const h = await open(mode);
      const selected = mode === 'corrupt' ? [{ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('broken') }] :
        mode === 'heic' ? [{ name: 'phone.heic', mimeType: 'image/heic', buffer: Buffer.from('heic') }] :
        mode === 'mixed' ? [fixtures[0], { name: 'original.pdf', mimeType: 'application/pdf', buffer: sample }] :
        mode === 'too-many' ? Array.from({ length: 11 }, () => fixtures[0]) : [fixtures[0]];
      if (mode === 'encode-failure') await h.page.evaluate(() => { HTMLCanvasElement.prototype.toBlob = callback => callback(null); });
      await h.page.locator('#fileReceipt').setInputFiles(selected);
      await h.page.locator('#btnSubmit').click();
      await h.page.waitForFunction(() => document.querySelector('#pcAlertBox').textContent.includes('Error:'));
      assert.equal(h.writes.length, 0, mode + ' must never create a request');
      assert.equal(await h.page.locator('#fileReceipt').isDisabled(), false);
      assert.deepEqual(h.errors, []); await h.page.close();
    }
    await renderPdf(sample);
    console.log('Verified image order, 4-page PDF rendering, landscape/long/EXIF pages, mobile picker, preview caching, byte-identical retry, existing PDF and 5 failure cases. Mock APIs only.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
