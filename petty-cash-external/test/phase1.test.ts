import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { makeDemoStore } from '../lib/demo-store.ts';
import { branches, parseExpense } from '../lib/expenses.ts';
import type { Profile } from '../lib/expenses.ts';

const employee: Profile = { id: randomUUID(), email: 'employee@example.test', name: 'Test Employee', branch: branches.Lahore, role: 'employee' };
const colleague: Profile = { id: randomUUID(), email: 'colleague@example.test', name: 'Another Employee', branch: branches.Karachi, role: 'employee' };

function requestForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    postingKey: randomUUID(), date: '2026-11-24', purpose: 'Office supplies', category: 'Others',
    otherCategory: 'Stationery', paymentSource: 'Company Cash', paymentMethod: 'Cash',
    itemName: 'Paper', quantity: '1.13', unit: 'Pack', price: '12.50'
  })) form.set(name, value);
  form.set('receipt', new File(['%PDF-1.7\n%%EOF'], 'receipt.pdf', { type: 'application/pdf' }));
  return form;
}

test('an invitation activates once; sign-in yields a revocable session linked to the Contact', async () => {
  const store = makeDemoStore(':memory:');
  const password = 'sample-account-choice';
  try {
    const code = store.invite(employee);
    assert.ok(code);
    assert.equal(await store.activate(colleague.email, code, password), false);
    assert.equal(await store.activate(employee.email, code, password), true);
    assert.equal(await store.activate(employee.email, code, password), false);
    assert.equal(await store.signIn(employee.email, 'wrong-password'), null);
    const session = await store.signIn(employee.email, password);
    assert.ok(session);
    assert.equal(store.sessionProfile(session.token)?.id, employee.id);
    store.signOut(session.token);
    assert.equal(store.sessionProfile(session.token), undefined);
  } finally { store.close(); }
});

test('receipt and request data are scoped to their owner and duplicate submissions reuse the original ID', async () => {
  const store = makeDemoStore(':memory:');
  try {
    store.invite(employee); store.invite(colleague);
    const form = requestForm();
    form.set('branch', String(colleague.branch));
    const expense = await parseExpense(form);
    assert.equal(expense.total, 1413);
    const id = store.createRequest(employee, expense);
    assert.equal(store.createRequest(employee, expense), id);
    assert.throws(() => store.createRequest(employee, { ...expense, purpose: 'Different' }), /different details/);
    assert.equal(store.listRequests(employee.id)[0].branch, employee.branch);
    assert.equal(store.listRequests(colleague.id).length, 0);
    assert.ok(store.receiptFor(employee.id, id));
    assert.equal(store.receiptFor(colleague.id, id), undefined);
  } finally { store.close(); }
});

test('rejects incomplete items, an invalid calendar date, and a renamed non-PDF receipt', async () => {
  const incomplete = requestForm(); incomplete.append('itemName', 'Extra item');
  await assert.rejects(parseExpense(incomplete), /complete items/);
  const date = requestForm(); date.set('date', '2026-02-30');
  await assert.rejects(parseExpense(date), /valid transaction date/);
  const receipt = requestForm(); receipt.set('receipt', new File(['not a PDF'], 'receipt.pdf'));
  await assert.rejects(parseExpense(receipt), /must be a PDF/);
  const quantity = requestForm(); quantity.set('quantity', '1.125');
  await assert.rejects(parseExpense(quantity), /at most two decimal places/);
});
