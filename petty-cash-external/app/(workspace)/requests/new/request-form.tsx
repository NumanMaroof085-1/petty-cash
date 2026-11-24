'use client';

import { useEffect, useRef, useState } from 'react';
import { categories, estimateLineTotal, money, paymentMethods, paymentSources, units } from '../../../../lib/expenses';
import { prepareReceipt, validateReceiptSelection } from '../../../../lib/receipt-preparation';
import { ActionForm } from '../../../action-form';
import { submitExpense } from '../../../actions';

function Choices({ name, options }: { name: string; options: object }) {
  return <select name={name} required><option value="">Select</option>
    {Object.keys(options).map(label => <option key={label}>{label}</option>)}</select>;
}

const suggestions: Record<string, string[]> = { Travel: ['Petrol', 'Hotel', 'Food'], 'Kitchen/Food': ['Chicken', 'Naan', 'Eggs'] };

export function RequestForm({ branch, date, postingKey }: { branch: string; date: string; postingKey: string }) {
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([0]);
  const [totals, setTotals] = useState<Record<number, number>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [receiptError, setReceiptError] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const prepared = useRef<File | null>(null);
  const selectedFiles = useRef<File[]>([]);
  const nextId = useRef(1);
  const itemsContainer = useRef<HTMLDivElement>(null);
  const newSuggestion = useRef<{ id: number; name: string } | null>(null);
  const touched = useRef(new Set<number>());

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!newSuggestion.current) return;
    const { id, name } = newSuggestion.current;
    const row = itemsContainer.current?.querySelector('[data-item="' + id + '"]');
    const input = row?.querySelector<HTMLInputElement>('input[name="itemName"]');
    if (input) input.value = name;
    touched.current.add(id);
    row?.querySelector<HTMLInputElement>('input[name="quantity"]')?.focus();
    newSuggestion.current = null;
  }, [items]);

  function addItem() {
    const id = nextId.current++;
    setItems(rows => [...rows, id]);
    return id;
  }

  function quickAdd(name: string) {
    const rows = Array.from(itemsContainer.current?.querySelectorAll<HTMLElement>('[data-item]') ?? []);
    const normal = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
    const match = rows.find(row => normal(row.querySelector<HTMLInputElement>('[name="itemName"]')?.value ?? '') === normal(name));
    if (match) { match.querySelector<HTMLInputElement>('[name="quantity"]')?.focus(); return; }
    const empty = rows.find(row => !touched.current.has(Number(row.dataset.item)));
    const nameInput = empty?.querySelector<HTMLInputElement>('[name="itemName"]');
    if (empty && nameInput) {
      nameInput.value = name;
      touched.current.add(Number(empty.dataset.item));
      empty.querySelector<HTMLInputElement>('[name="quantity"]')?.focus();
    } else if (items.length < 25) {
      newSuggestion.current = { id: addItem(), name };
    }
  }

  function selectFiles(next: File[]) {
    selectedFiles.current = next;
    prepared.current = null;
    setFiles(next);
    setReceiptError('');
    setPreview('');
  }

  async function receiptForSubmission() {
    const selection = selectedFiles.current;
    const pdf = prepared.current ?? await prepareReceipt(selection);
    if (selection !== selectedFiles.current) throw new Error('The receipt selection changed. Prepare it again.');
    prepared.current = pdf;
    return pdf;
  }

  async function showPreview() {
    setPreviewBusy(true); setReceiptError('');
    try { setPreview(URL.createObjectURL(await receiptForSubmission())); }
    catch (error) { setReceiptError(error instanceof Error ? error.message : 'Receipt preview is unavailable.'); }
    finally { setPreviewBusy(false); }
  }

  return (
    <ActionForm action={submitExpense} label="Submit request" saving="Saving request…" prepare={async data => {
      data.set('receipt', await receiptForSubmission());
    }}>
      <input type="hidden" name="postingKey" value={postingKey} />
      <section aria-labelledby="details-title">
        <h2 id="details-title">Request details</h2>
        <div className="grid">
          <label>Expense date<input type="date" name="date" defaultValue={date} required /></label>
          <label>Branch<input value={branch} readOnly /></label>
          <label>Category<select name="category" required value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">Select</option>
            {Object.keys(categories).map(label => <option key={label}>{label}</option>)}
          </select></label>
          {category === 'Others' && <label>Other category<input name="otherCategory" maxLength={100} required /></label>}
          <label>Payment source<Choices name="paymentSource" options={paymentSources} /></label>
          <label>Payment method<Choices name="paymentMethod" options={paymentMethods} /></label>
          <label className="wide">Purpose<textarea name="purpose" maxLength={500} required rows={3} /></label>
        </div>
      </section>
      <section className="form-section" aria-labelledby="items-title">
        <div className="section-heading">
          <h2 id="items-title">Line items</h2>
          <button className="secondary compact" type="button" disabled={items.length >= 25}
            onClick={addItem}>Add item</button>
        </div>
        {!!suggestions[category]?.length && <div className="inline-actions" role="group" aria-label="Quick add items">
          <span className="hint">Quick add</span>{suggestions[category].map(name =>
            <button className="secondary compact" type="button" key={name} onClick={() => quickAdd(name)}>{name}</button>)}
        </div>}
        <div className="item-list" ref={itemsContainer}>{items.map((id, index) => (
          <fieldset className="item-row" data-item={id} key={id} onInput={event => {
            touched.current.add(id);
            const quantity = event.currentTarget.querySelector<HTMLInputElement>('[name="quantity"]')?.value ?? '';
            const price = event.currentTarget.querySelector<HTMLInputElement>('[name="price"]')?.value ?? '';
            setTotals(previous => ({ ...previous, [id]: estimateLineTotal(quantity, price) }));
          }}>
            <legend>Item {index + 1}</legend>
            <label>Item name<input name="itemName" maxLength={100} required /></label>
            <label>Quantity<input name="quantity" type="number" min="0.01" max="999999.99" step="0.01" required /></label>
            <label>Unit<select name="unit" required>
              <option value="">Select</option>{units.map(unit => <option key={unit}>{unit}</option>)}
            </select></label>
            <label>Unit price (PKR)<input type="number" name="price" min="0" max="9999999.99" step="0.01" required /></label>
            {items.length > 1 && <button type="button" className="secondary compact" aria-label={'Remove item ' + (index + 1)}
              onClick={() => setItems(rows => rows.filter(row => row !== id))}>Remove</button>}
          </fieldset>
        ))}</div>
        <p className="preview-total" aria-live="polite">Grand total <strong>{money(items.reduce((sum, id) => sum + (totals[id] ?? 0), 0))}</strong></p>
      </section>
      <section className="form-section" aria-labelledby="receipt-title">
        <h2 id="receipt-title">Receipt</h2>
        <label>Receipt files<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple disabled={previewBusy}
          onChange={event => {
            const added = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            if (!added.length) return;
            const next = files.concat(added);
            try { validateReceiptSelection(next); selectFiles(next); }
            catch (error) { setReceiptError(error instanceof Error ? error.message : 'Choose supported receipt files.'); }
          }} /></label>
        <p className="hint">One PDF or up to ten JPG/PNG images. Images are combined into one PDF up to 10 MB.</p>
        {files.length > 0 && <>
          <ol className="plain-list">{files.map((file, index) => <li key={index}>
            <span>{file.name}</span>
            <span className="inline-actions">
              {files.length > 1 && <button type="button" className="secondary compact" disabled={previewBusy || index === 0}
                aria-label={'Move ' + file.name + ' up'} onClick={() => {
                  const reordered = [...files];
                  [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
                  selectFiles(reordered);
                }}>Up</button>}
              <button type="button" className="secondary compact" disabled={previewBusy} aria-label={'Remove ' + file.name}
                onClick={() => selectFiles(files.filter((_, position) => position !== index))}>Remove</button>
            </span>
          </li>)}</ol>
          <div className="inline-actions">
            <button type="button" className="secondary compact" onClick={showPreview} disabled={previewBusy}>
              {previewBusy ? 'Preparing…' : 'Prepare PDF'}
            </button>
            {preview && <><a href={preview} target="_blank" rel="noopener noreferrer">Preview PDF</a>
              <a href={preview} download={prepared.current?.name ?? 'receipt.pdf'}>Download PDF</a></>}
          </div>
        </>}
        {receiptError && <p role="alert" className="feedback error">{receiptError}</p>}
      </section>
    </ActionForm>
  );
}
