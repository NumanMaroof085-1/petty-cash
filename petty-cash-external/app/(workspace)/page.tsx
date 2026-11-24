import Link from 'next/link';
import { signedBalance } from '../../lib/contracts';
import { branchLabel, money } from '../../lib/expenses';
import { requireProfile } from '../../lib/session';
import { store } from '../../lib/store';

export default async function Home() {
  const profile = await requireProfile();
  const [requests, ledger] = await Promise.allSettled([store().listRequests(profile.id), store().activity(profile, profile.id)]);
  let balance = 'Unavailable';
  if (ledger.status === 'fulfilled') {
    try { balance = money(signedBalance(ledger.value)); } catch { /* Show unavailability rather than a partial balance. */ }
  }
  return <>
    <div className="page-heading">
      <div><h1>Petty cash</h1><p className="lede">{branchLabel(profile.branch)} workspace</p></div>
      <Link className="button" href="/requests/new">New request</Link>
    </div>
    <div className="summary-grid">
      <section className="panel section-panel"><h2>My cash balance</h2><p className="metric">{balance}</p></section>
      <section className="panel section-panel"><h2>Pending requests</h2><p className="metric">
        {requests.status === 'fulfilled' ? requests.value.filter(row => row.status === 'Pending').length : 'Unavailable'}
      </p></section>
    </div>
    <section className="panel section-panel space-top">
      <div className="section-heading"><h2>Recent requests</h2><Link href="/requests">View requests</Link></div>
      <ul className="plain-list">
        {requests.status !== 'fulfilled' ? <li>Request history is unavailable.</li>
          : requests.value.length ? requests.value.slice(0, 5).map(row => <li key={row.id}>
            <span>{row.title} · {row.status}</span><strong>{money(row.total)}</strong>
          </li>) : <li>No requests yet.</li>}
      </ul>
    </section>
  </>;
}
