import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { cashLabels, signedBalance } from '../../../lib/contracts';
import { branchLabel, money } from '../../../lib/expenses';
import { requireProfile } from '../../../lib/session';
import { store } from '../../../lib/store';
import { MovementForm } from './movement-form';

export default async function Finance({ searchParams }: { searchParams: Promise<{ employee?: string; posted?: string }> }) {
  const actor = await requireProfile();
  if (actor.role !== 'finance') notFound();
  const { employee, posted } = await searchParams;
  const directory = await store().directory(actor);
  const target = directory.find(person => person.id === employee);
  const movementKey = randomUUID();
  const activity = target ? await store().activity(actor, target.id) : [];
  let balance: number | undefined;
  try { balance = signedBalance(activity); } catch { /* An inconsistent ledger stays visible for review. */ }
  return <>
    <div className="page-heading"><div><h1>Finance</h1><p className="lede">Record advances and returns for {branchLabel(actor.branch)} employees.</p></div></div>
    {target && posted === '1' && <p className="feedback success" role="status">Cash movement recorded.</p>}
    <form className="filter-bar" method="get">
      <label>Employee<select name="employee" required defaultValue={target?.id ?? ''}>
          <option value="">Choose an employee</option>{directory.map(person => <option key={person.id} value={person.id}>
            {person.name} · {person.id === actor.id ? 'My account' : person.email}</option>)}
      </select></label>
      <button className="secondary" type="submit">View ledger</button>
    </form>
    {target && <>
      <section className="panel section-panel">
        <div className="section-heading"><h2>{target.name}</h2><span className="badge">{target.id === actor.id ? 'My balance' : 'Branch balance'}</span></div>
        <p className="metric">{balance === undefined ? 'Unavailable' : money(balance)}</p>
        <p className="hint">Positive balance means company cash held. A negative balance means the employee is owed money.</p>
      </section>
      <div className="summary-grid space-top">
        <section className="panel section-panel">
          <h2>New cash movement</h2>
          {target.id === actor.id ? <p className="lede">Another Finance user handles movements for your account.</p> :
            balance === undefined ? <p className="lede">Have the ledger reviewed before posting another movement.</p> :
            <div className="space-top"><MovementForm key={movementKey} balance={balance}
              employeeId={target.id} postingKey={movementKey} /></div>}
        </section>
        <section className="panel section-panel">
          <h2>Cash activity</h2>
          {activity.length ? <ul className="plain-list">{activity.map(row => <li key={row.id}>
            <span>{cashLabels[row.type] ?? 'Unknown movement'}<small>{row.date.slice(0, 10)} · {row.reference}</small>
              {row.notes && <small>{row.notes}</small>}</span><strong>{money(row.amount)}</strong>
          </li>)}</ul> : <p className="lede">No movements in this branch.</p>}
        </section>
      </div>
    </>}
  </>;
}
