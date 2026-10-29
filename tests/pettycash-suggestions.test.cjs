const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('pettycash-api.js', 'utf8');
function fixture(items = [{ name: '', quantity: '1', price: '' }]) {
  let document;
  class Element {
    constructor(tag = 'div') { this.tag = tag; this.children = []; this.dataset = {}; this.style = {}; this.value = ''; this.textContent = ''; this.listeners = {}; }
    appendChild(node) { this.children.push(node); return node; }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute(name, value) { this[name] = value; }
    querySelectorAll(selector) { return this.children.filter(node => node.tag === selector); }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    focus() { document.activeElement = this; }
  }
  let rows = [];
  function row(item = { name: '', quantity: '1', price: '' }) {
    const result = new Element('tr');
    const fields = Object.fromEntries(['name', 'qty', 'price'].map(name => [name, new Element('input')]));
    fields.name.value = item.name; fields.qty.value = item.quantity; fields.price.value = item.price;
    for (const field of Object.values(fields)) field.closest = () => result;
    const total = { innerText: '0.00' };
    result.querySelector = selector => ({ '.name-input': fields.name, '.qty-input': fields.qty,
      '.price-input': fields.price, '.row-total': total }[selector]);
    result.remove = () => { rows = rows.filter(existing => existing !== result); };
    result.fields = fields; result.dataset.pcTouched = item.touched ? 'true' : 'false';
    return result;
  }
  rows = items.map(row);
  const body = new Element('tbody');
  body.appendChild = added => { rows.push(added); return added; };
  body.contains = candidate => rows.includes(candidate);
  Object.defineProperty(body, 'innerHTML', { set() { rows = [row()]; } });
  const nodes = Object.fromEntries(['pcSuggestionItems', 'pcSuggestionStatus', 'pcSuggestionCategory',
    'selCategory', 'otherCategoryGroup', 'btnSubmit', 'btnAddItem', 'pcLoadingOverlay', 'pcLoadingText',
    'portalUserId', 'portalUserName', 'portalUserEmail', 'txtDate', 'lblGrandTotal'].map(id => [id, new Element()]));
  nodes.tableBody = body; nodes.selCategory.value = 'Travel'; nodes.txtDate.value = '2026-10-29';
  nodes.portalUserId.value = '11111111-1111-4111-8111-111111111111';
  document = { readyState: 'loading', addEventListener() {}, getElementById(id) { return nodes[id] || null; },
    querySelectorAll() { return rows; }, createElement(tag) { return tag === 'tr' ? row() : new Element(tag); } };
  const calls = [];
  const root = { document, PettyCashReceipts: { mount() {} } }; root.parent = root;
  const context = vm.createContext({ window: root, document, console: { log() {}, warn() {}, error() {} },
    shell: { getTokenDeferred: async () => 'token' }, async fetch(url) {
      calls.push(url); return { ok: true, status: 200, headers: { get() {} },
        async text() { return JSON.stringify({ _hr_department_value: '22222222-2222-4222-8222-222222222222',
          _hr_reportstomanager_value: '33333333-3333-4333-8333-333333333333' }); } };
    } });
  vm.runInContext(source, context);
  const evaluate = code => vm.runInContext(code, context);
  evaluate('renderItemSuggestions()');
  return { root, nodes, document, calls, evaluate, get rows() { return rows; },
    use: name => root.addSuggestedItem(name),
    category(value) { nodes.selCategory.value = value; evaluate('toggleOtherCategory()'); } };
}
test('suggestion card precedes Itemized Details and initially renders user-provided Travel items', () => {
  const h = fixture();
  assert.deepEqual(h.nodes.pcSuggestionItems.children.map(button => button.textContent), ['Petrol', 'Hotel', 'Food']);
  assert.ok(h.nodes.pcSuggestionItems.children.every(button => button.type === 'button' && !button.disabled));
  assert.equal(h.rows[0].fields.name.value, ''); assert.equal(h.calls.length, 0);
  const html = fs.readFileSync('New Petty Cash Request.html', 'utf8');
  assert.ok(html.indexOf('id="pcSuggestionCard"') < html.indexOf('<!-- Section 2: Itemized Details -->'));
  assert.match(html, /id="pcSuggestionStatus" role="status" aria-live="polite"/);
});
test('first untouched blank row is filled, defaults preserved and quantity receives focus', () => {
  const h = fixture(); const original = h.rows[0];
  h.use('Petrol');
  assert.equal(h.rows.length, 1); assert.equal(h.rows[0], original);
  assert.equal(original.fields.name.value, 'Petrol'); assert.equal(original.fields.qty.value, '1');
  assert.equal(original.fields.price.value, ''); assert.equal(h.document.activeElement, original.fields.qty);
  assert.equal(h.nodes.lblGrandTotal.innerText, '0.00'); assert.equal(h.calls.length, 0);
});
test('an untouched blank row is reused before appending another row', () => {
  const h = fixture([{ name: 'Manual', quantity: '2', price: '90' }, { name: '', quantity: '1', price: '' },
    { name: '', quantity: '1', price: '' }]);
  h.use('Hotel');
  assert.equal(h.rows.length, 3); assert.equal(h.rows[1].fields.name.value, 'Hotel');
  assert.equal(h.rows[2].fields.name.value, ''); assert.equal(h.nodes.lblGrandTotal.innerText, '180.00');
});
test('populated, edited or non-default rows are never overwritten; a fresh row is appended', () => {
  const h = fixture([{ name: 'Manual', quantity: '2', price: '90' }, { name: '', quantity: '5', price: '' },
    { name: '', quantity: '1', price: '', touched: true }, { name: '', quantity: '1', price: '0' }]);
  h.use('Food');
  assert.equal(h.rows.length, 5); assert.equal(h.rows[4].fields.name.value, 'Food');
  assert.deepEqual(h.rows.slice(0, 4).map(row => Object.values(row.fields).map(field => field.value)),
    [['Manual', '2', '90'], ['', '5', ''], ['', '1', ''], ['', '1', '0']]);
});
test('repeated clicks focus an existing case/whitespace-normalized item without changing any values', () => {
  const h = fixture([{ name: '  cHICKen  ', quantity: '3', price: '250' }]); h.category('Kitchen/Food');
  h.use('Chicken'); h.use('Chicken');
  assert.equal(h.rows.length, 1); assert.equal(h.rows[0].fields.name.value, '  cHICKen  ');
  assert.equal(h.rows[0].fields.qty.value, '3'); assert.equal(h.rows[0].fields.price.value, '250');
  assert.equal(h.document.activeElement, h.rows[0].fields.qty); assert.match(h.nodes.pcSuggestionStatus.textContent, /already listed/);
});
test('a manually renamed suggestion is preserved and clicking its old name adds a separate item', () => {
  const h = fixture(); h.category('Kitchen/Food'); h.use('Chicken');
  h.rows[0].fields.name.value = 'Chicken breast'; h.rows[0].fields.price.value = '100';
  h.use('Chicken'); assert.equal(h.rows.length, 2);
  assert.equal(h.rows[0].fields.name.value, 'Chicken breast'); assert.equal(h.rows[1].fields.name.value, 'Chicken');
});
test('switching categories refreshes only suggestions and preserves existing rows and Other details behavior', () => {
  const h = fixture(); h.use('Petrol'); h.rows[0].fields.qty.value = '2'; h.rows[0].fields.price.value = '100';
  h.category('Kitchen/Food');
  assert.deepEqual(h.nodes.pcSuggestionItems.children.map(button => button.textContent), ['Chicken', 'Naan', 'Eggs']);
  assert.equal(h.rows[0].fields.name.value, 'Petrol'); assert.equal(h.rows[0].fields.price.value, '100');
  h.category('Others'); assert.equal(h.nodes.otherCategoryGroup.style.display, 'block');
  assert.equal(h.nodes.pcSuggestionItems.children.length, 0); assert.match(h.nodes.pcSuggestionStatus.textContent, /manually/);
  h.category('IT Equipments'); assert.equal(h.nodes.otherCategoryGroup.style.display, 'none'); assert.equal(h.rows.length, 1);
  assert.equal(h.use('Petrol'), null, 'Stale category actions do not insert items');
});
test('manual row deletion and manual Add Item still work normally', () => {
  const h = fixture(); h.use('Petrol'); h.evaluate('addNewItemRow()');
  h.rows[1].fields.name.value = 'Manual product'; h.rows[1].fields.price.value = '25';
  h.evaluate('calculateTotals()'); assert.equal(h.nodes.lblGrandTotal.innerText, '25.00');
  const removed = h.rows[0]; h.root.deleteRow({ closest() { return removed; } });
  assert.equal(h.rows.length, 1); assert.equal(h.rows[0].fields.name.value, 'Manual product');
  h.use('Petrol'); assert.equal(h.rows.length, 2);
});
test('configuration deduplicates labels and renders literal text rather than interpreting markup', () => {
  const h = fixture();
  h.evaluate('DATAVERSE_CONFIG.itemSuggestions.Travel = ["Petrol", " petrol ", "", null, "<img src=x>"]; renderItemSuggestions()');
  assert.deepEqual(h.nodes.pcSuggestionItems.children.map(button => button.textContent), ['Petrol', '<img src=x>']);
  h.use('<img src=x>'); assert.equal(h.rows[0].fields.name.value, '<img src=x>');
  assert.equal(h.nodes.pcSuggestionItems.children[1].children.length, 0);
});
for (const state of ['submissionInProgress = true', 'pendingSubmission = { id: "saved", uncertain: false }',
  'pendingSubmission = { id: null, uncertain: true }']) {
  test('suggestions lock visually and programmatically for ' + state, () => {
    const h = fixture(); h.evaluate(state + '; updateSuggestionLock()');
    assert.ok(h.nodes.pcSuggestionItems.children.every(button => button.disabled));
    assert.equal(h.use('Petrol'), null); assert.equal(h.rows[0].fields.name.value, '');
    h.category('Kitchen/Food'); assert.ok(h.nodes.pcSuggestionItems.children.every(button => button.disabled));
    h.evaluate('submissionInProgress = false; pendingSubmission = null; updateSuggestionLock()');
    assert.ok(h.nodes.pcSuggestionItems.children.every(button => !button.disabled));
    h.use('Chicken'); assert.equal(h.rows[0].fields.name.value, 'Chicken');
    assert.equal(h.calls.length, 0);
  });
}
test('delegated manual-input tracking survives initialization and prevents reuse of a cleared draft', async () => {
  const h = fixture(); h.evaluate('initializePettyCashApp()'); await h.evaluate('ensureCurrentUserContext()');
  const original = h.rows[0]; original.fields.name.value = '';
  h.nodes.tableBody.listeners.input({ target: original.fields.name });
  assert.equal(original.dataset.pcTouched, 'true');
  const before = h.calls.length; h.use('Petrol');
  assert.equal(h.rows.length, 2); assert.equal(original.fields.name.value, ''); assert.equal(h.calls.length, before);
});
