'use client';

import { useState } from 'react';
import { money } from '../../../lib/expenses';
import { ActionForm } from '../../action-form';
import { submitMovement } from '../../actions';

export function MovementForm({ employeeId, postingKey, balance }: { employeeId: string; postingKey: string; balance: number }) {
  const [movement, setMovement] = useState('cash_given');
  const [amount, setAmount] = useState('');
  const minor = Math.round(Number(amount) * 100);
  const valid = /^\d{1,7}(?:\.\d{1,2})?$/.test(amount) && minor > 0;
  const projected = balance + (movement === 'cash_given' ? minor : -minor);

  return <ActionForm action={submitMovement} label="Record movement" saving="Recording…">
    <input type="hidden" name="employeeId" value={employeeId} />
    <input type="hidden" name="postingKey" value={postingKey} />
    <label>Movement<select name="movement" value={movement} onChange={event => setMovement(event.target.value)} required>
      <option value="cash_given">Advance given</option><option value="cash_returned">Cash returned</option>
    </select></label>
    <label>Amount (PKR)<input name="amount" type="number" min="0.01" max="9999999.99" step="0.01" required
      value={amount} onChange={event => setAmount(event.target.value)} /></label>
    <p className="hint" aria-live="polite">Estimated balance after movement {valid && Number.isSafeInteger(projected) ? money(projected) : '—'}</p>
    <label>Reason<input name="notes" maxLength={100} required /></label>
    <label className="check-field"><input type="checkbox" name="confirm" required />I confirm the cash was given or returned.</label>
  </ActionForm>;
}
