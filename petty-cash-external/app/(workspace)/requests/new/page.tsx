import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { branchLabel } from '../../../../lib/expenses';
import { requireProfile } from '../../../../lib/session';
import { RequestForm } from './request-form';

export default async function NewRequest() {
  const profile = await requireProfile();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Karachi', dateStyle: 'short' }).format(new Date());
  return (
    <>
      <Link href="/requests" className="back-link">My requests</Link>
      <div className="page-heading"><div><h1>New request</h1><p className="lede">Record an expense and attach its receipt.</p></div></div>
      <section className="panel request-panel" aria-label="New expense request">
        <RequestForm branch={branchLabel(profile.branch)} date={today} postingKey={randomUUID()} />
      </section>
    </>
  );
}
