import Link from 'next/link';
import { ActionForm } from '../action-form';
import { requestReset } from '../actions';
import { AccessLayout } from '../ui';

export default function ForgotPassword() {
  return <AccessLayout title="Forgot password" introduction="Request a one-time code at your employee email address.">
    <ActionForm action={requestReset} label="Send reset code" saving="Requesting…">
      <label>Email<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
    </ActionForm>
    <p className="access-link"><Link href="/reset-password">I have a reset code</Link></p>
    <p className="access-link"><Link href="/sign-in">Back to sign in</Link></p>
  </AccessLayout>;
}
