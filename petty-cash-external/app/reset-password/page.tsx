import Link from 'next/link';
import { ActionForm } from '../action-form';
import { resetPassword } from '../actions';
import { AccessLayout } from '../ui';

export default function ResetPassword() {
  return <AccessLayout title="Reset password" introduction="Enter your one-time code and choose a new password.">
    <ActionForm action={resetPassword} label="Set new password" saving="Updating…">
      <label>Email<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
      <label>Reset code<input name="code" autoComplete="off" spellCheck={false} maxLength={43} required /></label>
      <label>New password<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
      <label>Confirm password<input type="password" name="confirmPassword" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
    </ActionForm>
    <p className="access-link"><Link href="/sign-in">Back to sign in</Link></p>
  </AccessLayout>;
}
