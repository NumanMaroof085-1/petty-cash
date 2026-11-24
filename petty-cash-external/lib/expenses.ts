// Choice values from the Dataverse solution. Store currency in minor units.
export const branches = { Lahore: 123140000, Karachi: 123140001 };
export const categories = {
  Travel: 123140000,
  'Kitchen/Food': 123140001,
  'IT Equipments': 123140002,
  'Finance Things': 123140003,
  'Technical Equipments': 123140004,
  Others: 123140005
};
export const paymentSources = { 'Company Cash': 123140001, 'Own Pocket': 123140000 };
export const paymentMethods = { Cash: 123140000, 'Card / Online': 123140001, Borrow: 123140002 };
export const units = [
  'Piece', 'Liter', 'Milliliter', 'Kilogram', 'Gram', 'Dozen', 'Pack', 'Box', 'Bag', 'Bottle',
  'Can', 'Carton', 'Pair', 'Set', 'Roll', 'Sheet', 'Meter', 'Centimeter', 'Square meter',
  'Hour', 'Day', 'Trip', 'Service'
] as const;

export type BusinessRole = 'employee' | 'manager' | 'finance' | 'admin';
export type Profile = { id: string; email: string; name: string; branch: number; role: BusinessRole };
export type ExpenseItem = { name: string; quantity: number; unit: string; unitPrice: number; total: number };
export type ExpenseDraft = {
  postingKey: string; date: string; purpose: string; category: string; otherCategory: string;
  paymentSource: string; paymentMethod: string; items: ExpenseItem[]; total: number;
  pdf: { name: string; bytes: Uint8Array };
};

export function money(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency', currency: 'PKR', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(value / 100);
}

function lineTotal(quantity: number, unitPrice: number) {
  return Number((BigInt(quantity) * BigInt(unitPrice) + 50n) / 100n);
}

export function estimateLineTotal(quantity: string, unitPrice: string) {
  try { return lineTotal(decimal(quantity, 6, 'quantity'), decimal(unitPrice, 7, 'unit price')); }
  catch { return 0; }
}

export function branchLabel(value: number) {
  return Object.entries(branches).find(([, code]) => code === value)?.[0] ?? 'Unassigned';
}

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

function choice(form: FormData, name: string, options: object) {
  const value = field(form, name);
  if (!Object.hasOwn(options, value)) throw new Error('Choose a valid ' + name + '.');
  return value;
}

function decimal(raw: FormDataEntryValue, wholeDigits: 6 | 7, label: string) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const pattern = wholeDigits === 6 ? /^\d{1,6}(?:\.\d{1,2})?$/ : /^\d{1,7}(?:\.\d{1,2})?$/;
  if (!pattern.test(value)) throw new Error('Enter a valid ' + label + '.');
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export async function parseExpense(form: FormData): Promise<ExpenseDraft> {
  const postingKey = field(form, 'postingKey');
  const date = field(form, 'date');
  const purpose = field(form, 'purpose');
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(postingKey)) {
    throw new Error('Reload the page and try submitting again.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error('Enter a valid transaction date.');
  }
  if (!purpose || purpose.length > 500) throw new Error('Enter a purpose of 1–500 characters.');
  const category = choice(form, 'category', categories);
  const paymentSource = choice(form, 'paymentSource', paymentSources);
  const paymentMethod = choice(form, 'paymentMethod', paymentMethods);
  const otherCategory = category === 'Others' ? field(form, 'otherCategory') : '';
  if (category === 'Others' && (!otherCategory || otherCategory.length > 100)) {
    throw new Error('Describe the other category in 1–100 characters.');
  }

  const names = form.getAll('itemName');
  const quantities = form.getAll('quantity');
  const itemUnits = form.getAll('unit');
  const prices = form.getAll('price');
  if (names.length < 1 || names.length > 25 ||
      [quantities, itemUnits, prices].some(list => list.length !== names.length)) {
    throw new Error('Include between 1 and 25 complete items.');
  }
  const items = names.map((raw, index) => {
    const name = typeof raw === 'string' ? raw.trim() : '';
    const quantity = decimal(quantities[index], 6, 'quantity with at most two decimal places');
    const unit = String(itemUnits[index]);
    const unitPrice = decimal(prices[index], 7, 'unit price');
    if (!name || name.length > 100 || !units.some(option => option === unit) || quantity <= 0) {
      throw new Error('Enter an item name, a positive quantity, and a unit on every row.');
    }
    const total = lineTotal(quantity, unitPrice);
    return { name, quantity: quantity / 100, unit, unitPrice, total };
  });
  const total = items.reduce((sum, item) => sum + item.total, 0);
  if (total <= 0 || total > 999999999) throw new Error('Enter a request total between PKR 0.01 and PKR 9,999,999.99.');

  const receipt = form.get('receipt');
  if (!(receipt instanceof File) || receipt.size < 5 || receipt.size > 10 * 1024 * 1024) {
    throw new Error('Attach one PDF no larger than 10 MB.');
  }
  const bytes = new Uint8Array(await receipt.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('The receipt must be a PDF.');
  const name = receipt.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-110) || 'receipt.pdf';
  return { postingKey, date, purpose, category, otherCategory, paymentSource, paymentMethod,
    items, total, pdf: { name, bytes } };
}
