import Link from 'next/link';
import { ActionForm } from '../action-form';
import { signIn } from '../actions';
import { AccessLayout } from '../ui';

export default async function SignIn({ searchParams }: { searchParams: Promise<{ activated?: string; reset?: string }> }) {
  const { activated, reset } = await searchParams;
  return (
    <AccessLayout title="Sign in" introduction="Use your employee email to manage your petty cash requests.">
      {activated === '1' && <p role="status" className="feedback success">Your account is active. Sign in to continue.</p>}
      {reset === '1' && <p role="status" className="feedback success">Your password was updated. Sign in to continue.</p>}
      <ActionForm action={signIn} label="Sign in" saving="Signing in…">
        <label>Email<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
        <label>Password<input type="password" name="password" autoComplete="current-password" maxLength={128} required /></label>
      </ActionForm>
      <p className="access-link">Have an invitation? <Link href="/activate">Activate your account</Link></p>
      <p className="access-link"><Link href="/forgot-password">Forgot your password?</Link></p>
    </AccessLayout>
  );
}
