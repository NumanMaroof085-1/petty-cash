import Link from 'next/link';
import type { ReactNode } from 'react';
import { branchLabel } from '../../lib/expenses';
import { requireProfile } from '../../lib/session';
import { isDemo } from '../../lib/store';
import { signOut } from '../actions';
import { Brand } from '../ui';

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile();
  return (
    <>
      <header className="site-header"><div className="site-header-inner">
        <Brand />
        <nav aria-label="Workspace">
          <Link href="/">Home</Link><Link href="/requests">My requests</Link><Link href="/requests/new">New request</Link>
          {profile.role === 'finance' && <Link href="/finance">Finance</Link>}
          {profile.role === 'admin' && <Link href="/admin">Admin</Link>}
        </nav>
        <div className="account">
          <span><strong>{profile.name}</strong><small>{branchLabel(profile.branch)}{isDemo() ? ' · Local demo' : ''}</small></span>
          <form action={signOut}><button type="submit" className="secondary compact">Sign out</button></form>
        </div>
      </div></header>
      <main className="workspace">{children}</main>
      <footer className="site-footer">Industrad Petty Cash</footer>
    </>
  );
}
