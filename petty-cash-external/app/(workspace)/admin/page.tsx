import { notFound } from 'next/navigation';
import { branchLabel } from '../../../lib/expenses';
import { requireProfile } from '../../../lib/session';
import { isDemo, store } from '../../../lib/store';
import { ActionForm } from '../../action-form';
import { createEmployee, issueInvitation } from '../../actions';

export default async function Admin({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const actor = await requireProfile();
  if (actor.role !== 'admin') notFound();
  const [{ created }, directory, departments] = await Promise.all([
    searchParams, store().directory(actor), store().departments(actor)
  ]);
  const domain = process.env.PC_WORK_EMAIL_DOMAIN || 'industrad.com';
  const emailPattern = isDemo() ? undefined : '[^@]+@' + domain.replace(/[a-z]|\./gi, character =>
    character === '.' ? '\\.' : '[' + character.toLowerCase() + character.toUpperCase() + ']');
  return <>
    <div className="page-heading"><div><h1>Admin</h1><p className="lede">Manage Contacts and invitations for {branchLabel(actor.branch)}.</p></div></div>
    {created === '1' && <p role="status" className="feedback success">Contact created. Select the Contact to issue a sign-in invitation.</p>}
    <div className="summary-grid">
      <section className="panel section-panel">
        <h2>Create employee Contact</h2>
        <div className="space-top"><ActionForm action={createEmployee} label="Create Contact" saving="Creating…">
          <div className="grid">
            <label>First name<input name="firstName" maxLength={50} required /></label>
            <label>Last name<input name="lastName" maxLength={50} required /></label>
            <label className="wide">Company email<input name="email" type="email" maxLength={254} pattern={emailPattern}
              title={emailPattern ? 'Use your @' + domain + ' email address' : undefined} required /></label>
            <label>Role<select name="role" required><option value="employee">Employee</option><option value="manager">Manager</option><option value="finance">Finance</option></select></label>
            <label>Branch<input value={branchLabel(actor.branch)} readOnly /></label>
            <label>Department<select name="departmentId" required><option value="">Choose</option>
              {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label>Manager<select name="managerId" required><option value="">Choose</option>
              {directory.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          </div>
        </ActionForm></div>
      </section>
      <section className="panel section-panel">
        <h2>Invite an employee</h2>
        <p className="lede">The employee uses a one-time code to set their own password.</p>
        <div className="space-top"><ActionForm action={issueInvitation} label="Issue invitation" saving="Issuing…">
          <label>Contact<select name="contactId" required><option value="">Choose a Contact</option>
            {directory.filter(person => person.id !== actor.id).map(person => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}
          </select></label>
        </ActionForm></div>
      </section>
    </div>
  </>;
}
