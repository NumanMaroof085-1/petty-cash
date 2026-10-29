const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('pettycash-receipts.js', 'utf8');
function fixture(options = {}) {
  const active = new Set(), revoked = [], pages = [], decodes = [], canvases = [];
  class Element {
    constructor() { this.children = []; this.dataset = {}; this.hidden = false; this.disabled = false; this.textContent = ''; }
    appendChild(node) { this.children.push(node); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(name, value) { this[name] = value; }
    removeAttribute(name) { delete this[name]; }
    querySelectorAll() { return this.children.flatMap(node => [node, ...node.querySelectorAll()]).filter(node => node.tag === 'button'); }
  }
  const nodes = Object.fromEntries(['fileReceipt', 'pcReceiptList', 'pcReceiptStatus', 'pcPrepareReceipt',
    'pcClearReceipts', 'pcReceiptPreview', 'pcReceiptDownload', 'pcReceiptArea'].map(id => [id, new Element()]));
  const document = { getElementById(id) { return nodes[id] || null; }, createElement(tag) {
    const node = new Element(); node.tag = tag;
    if (tag === 'canvas') {
      canvases.push(node);
      node.getContext = () => ({ fillRect() {}, drawImage() {} });
      node.toBlob = callback => callback(options.failedEncode ? null : new Blob([new Uint8Array([255,216,255,217])], { type: 'image/jpeg' }));
    }
    return node;
  } };
  let sequence = 0;
  const root = { document, File, URL: {
    createObjectURL() { const url = 'blob:fixture-' + ++sequence; active.add(url); return url; },
    revokeObjectURL(url) { active.delete(url); revoked.push(url); }
  }, async createImageBitmap(file) {
    decodes.push(file);
    if (options.failedDecode) throw new Error('Decode failed');
    return { width: options.width || 100, height: options.height || 200, close() {} };
  }, jspdf: { jsPDF: class {
    constructor(settings) { this.addPage(settings.format, settings.orientation); this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }; }
    addPage(format, orientation) { pages.push({ format, orientation }); }
    addImage(bytes, format, x, y, width, height) { Object.assign(pages.at(-1), { formatName: format, x, y, width, height }); }
    output() { return new Blob([options.largeOutput ? new Uint8Array(11 * 1024 * 1024) : '%PDF-1.7\nfixture'], { type: 'application/pdf' }); }
  } } };
  if (options.noLibrary) delete root.jspdf;
  if (options.failedDecode) root.Image = class { set src(_) { this.onerror(); } };
  vm.runInNewContext(source, { window: root, DataView, Uint8Array, WeakMap, Map, Object, Array, Number, String, Math, Promise });
  const api = root.PettyCashReceipts;
  return { api, controller: api.mount(), root, nodes, pages, decodes, canvases, active, revoked };
}
function png(name = 'receipt.png', width = 100, height = 200) {
  const bytes = new Uint8Array(32);
  bytes.set([137,80,78,71,13,10,26,10]); bytes.set([73,72,68,82], 12);
  const view = new DataView(bytes.buffer); view.setUint32(16, width); view.setUint32(20, height);
  return new File([bytes], name, { type: 'image/png', lastModified: 1 });
}
function pdf() { return new File(['%PDF-1.7\nfixture'], 'existing.pdf', { type: 'application/pdf', lastModified: 1 }); }

test('picker accepts one PDF or 1–10 JPG/PNG, rejects mixed types and unsupported formats atomically', () => {
  const h = fixture();
  assert.equal(h.api.validateSelection([pdf()]), 'pdf');
  assert.equal(h.api.validateSelection(Array.from({ length: 10 }, () => png())), 'images');
  for (const files of [[], [pdf(), pdf()], [pdf(), png()], Array.from({ length: 11 }, () => png()),
    [new File(['fake'], 'phone.heic', { type: 'image/heic' })], [new File(['fake'], 'x.svg', { type: 'image/svg+xml' })]]) {
    assert.throws(() => h.api.validateSelection(files));
  }
  h.controller.append([png()]);
  const original = h.controller.snapshot().key;
  assert.throws(() => h.controller.append([pdf()]));
  assert.equal(h.controller.snapshot().key, original);
});
test('input sizes and zero-length files are bounded independently of output size', () => {
  const { api } = fixture();
  for (const files of [[{ type: 'image/jpeg', size: 0 }], [{ type: 'image/jpeg', size: 16 * 1024 * 1024 }],
    Array.from({ length: 3 }, () => ({ type: 'image/jpeg', size: 15 * 1024 * 1024 })),
    [{ type: 'application/pdf', size: 11 * 1024 * 1024 }]]) assert.throws(() => api.validateSelection(files));
});
test('headers detect spoofed PDFs/images and reject oversized dimensions before decoding', async () => {
  const h = fixture();
  for (const file of [new File(['not a pdf'], 'x.pdf', { type: 'application/pdf' }),
    new File(['not a png'], 'x.png', { type: 'image/png' }), png('giant.png', 12001, 2), png('many-pixels.png', 8000, 8000)]) {
    h.controller.reset(); h.controller.append([file]);
    await assert.rejects(h.controller.prepare(h.controller.snapshot()));
  }
  assert.equal(h.decodes.length, 0);
});
test('existing PDF bytes and filename pass through unchanged, without requiring the PDF generator', async () => {
  const h = fixture({ noLibrary: true }), file = pdf();
  h.controller.append([file]);
  assert.equal(await h.controller.prepare(h.controller.snapshot()), file);
  assert.equal(h.nodes.pcReceiptPreview.hidden, false);
  assert.equal(h.nodes.pcReceiptDownload.download, file.name);
  assert.equal(h.decodes.length, 0);
});
test('missing PDF MIME is normalized only after verifying the actual PDF header', async () => {
  const h = fixture(), file = new File(['%PDF-1.7\nfixture'], 'existing.pdf');
  h.controller.append([file]);
  const result = await h.controller.prepare(h.controller.snapshot());
  assert.equal(result.type, 'application/pdf');
  assert.equal(await result.text(), await file.text());
});
test('images generate one PDF page each, cache exact File bytes and collapse concurrent preparation', async () => {
  const h = fixture(); h.controller.append([png('first.png'), png('second.png')]);
  const selection = h.controller.snapshot();
  const [first, concurrent] = await Promise.all([h.controller.prepare(selection), h.controller.prepare(selection)]);
  assert.equal(first, concurrent);
  assert.equal(await h.controller.prepare(selection), first);
  assert.equal(first.type, 'application/pdf'); assert.equal(first.name, 'receipts.pdf');
  assert.equal(h.pages.length, 2); assert.equal(h.decodes.length, 2);
  assert.ok(h.canvases.every(canvas => canvas.width === 0 && canvas.height === 0));
  assert.ok(h.pages.every(page => page.formatName === 'JPEG' && page.width > 0 && page.x >= 10));
});
test('order changes invalidate previews/cache and prepared page order follows the selected files', async () => {
  const h = fixture(), first = png('first.png'), second = png('second.png');
  h.controller.append([first, second]);
  const oldSelection = h.controller.snapshot(); await h.controller.prepare(oldSelection);
  const oldUrl = h.nodes.pcReceiptPreview.href;
  h.controller.move(1, -1);
  assert.equal(h.nodes.pcReceiptPreview.hidden, true); assert.ok(h.revoked.includes(oldUrl));
  await assert.rejects(h.controller.prepare(oldSelection), /selection changed/);
  await h.controller.prepare(h.controller.snapshot());
  assert.deepEqual(h.decodes, [first, second, second, first]);
});
test('partial-save lock prevents all user selection changes; reset clears files and object URLs', async () => {
  const h = fixture(); h.controller.append([png()]); await h.controller.prepare(h.controller.snapshot());
  h.controller.setLocked(true);
  assert.throws(() => h.controller.append([png()]), /locked/);
  assert.throws(() => h.controller.move(0, 1), /locked/);
  assert.throws(() => h.controller.remove(0), /locked/);
  assert.equal(h.nodes.fileReceipt.disabled, true);
  h.controller.reset();
  assert.equal(h.active.size, 0); assert.equal(h.controller.snapshot().files.length, 0);
  assert.equal(h.nodes.fileReceipt.required, true);
});
test('reset never reuses a selection identity for different files, and pending thumbnail checks cannot leak URLs', async () => {
  const h = fixture(); h.controller.append([png('old.png')]);
  const old = h.controller.snapshot(); h.controller.reset();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.active.size, 0);
  h.controller.append([png('new.png')]);
  assert.notEqual(h.controller.snapshot().key, old.key);
  await assert.rejects(h.controller.prepare(old), /selection changed/);
});
test('oversized output fails without dropping images or caching a partial PDF', async () => {
  const h = fixture({ largeOutput: true }); h.controller.append([png(), png()]);
  await assert.rejects(h.controller.prepare(h.controller.snapshot()), /exceeds 10 MB/);
  assert.equal(h.controller.snapshot().files.length, 2);
  assert.equal(h.nodes.pcReceiptPreview.hidden, true);
  assert.equal(h.nodes.pcReceiptPreview.href, undefined);
  assert.equal(h.nodes.fileReceipt.disabled, false);
});
test('missing library, failed image encoding and failed decoding leave selection available for correction', async () => {
  for (const options of [{ noLibrary: true }, { failedEncode: true }, { failedDecode: true }]) {
    const h = fixture(options); h.controller.append([png()]);
    await assert.rejects(h.controller.prepare(h.controller.snapshot()));
    assert.equal(h.nodes.fileReceipt.disabled, false);
    assert.equal(h.controller.snapshot().files.length, 1);
  }
});
test('long and landscape receipts get appropriate pages without altering aspect ratio', async () => {
  for (const [width, height, orientation] of [[1000, 500, 'landscape'], [500, 2500, 'portrait']]) {
    const h = fixture({ width, height }); h.controller.append([png('receipt.png', width, height)]);
    await h.controller.prepare(h.controller.snapshot());
    assert.equal(h.pages[0].orientation, orientation);
    assert.ok(Math.abs(h.pages[0].width / h.pages[0].height - width / height) < 0.00001);
    if (height / width > 2.2) assert.ok(Array.isArray(h.pages[0].format));
  }
});
test('receipt module has no external conversion/storage calls; template includes pinned local library and current module', () => {
  assert.doesNotMatch(source, /\bfetch\s*\(|localStorage|sessionStorage|https:\/\//);
  const template = fs.readFileSync('Petty Cash Receipts.html', 'utf8');
  assert.ok(template.includes(source));
  assert.match(template, /jsPDF 4\.2\.1/);
  const html = fs.readFileSync('New Petty Cash Request.html', 'utf8');
  assert.equal(html.split("{% include 'Petty Cash Receipts' %}").length - 1, 1);
  assert.match(html, /id="fileReceipt"[^>]*\bmultiple\b/);
  assert.doesNotMatch(html, /accept="image\/\*/);
});
