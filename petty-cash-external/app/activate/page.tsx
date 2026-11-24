import Link from 'next/link';
import { ActionForm } from '../action-form';
import { activateAccount } from '../actions';
import { AccessLayout } from '../ui';

export default function Activate() {
  return (
    <AccessLayout title="Activate your account" introduction="Enter your invitation code and choose a password.">
      <ActionForm action={activateAccount} label="Activate account" saving="Activating…">
        <label>Email<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
        <label>Invitation code<input name="code" autoComplete="off" spellCheck={false} maxLength={43} required /></label>
        <label>Password<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <label>Confirm password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      </ActionForm>
      <p className="access-link"><Link href="/sign-in">Back to sign in</Link></p>
    </AccessLayout>
  );
}
