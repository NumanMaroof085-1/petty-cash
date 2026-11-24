import Link from 'next/link';
import type { ReactNode } from 'react';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Industrad Petty Cash home">
      <img src="/industrad-engineering.png" width="300" height="86" alt="Industrad" />
    </Link>
  );
}

export function AccessLayout({ title, introduction, children }: {
  title: string; introduction: string; children: ReactNode;
}) {
  return (
    <main className="access">
      <div className="access-brand"><Brand /></div>
      <section className="panel access-panel" aria-labelledby="access-title">
        <h1 id="access-title">{title}</h1>
        <p className="lede">{introduction}</p>
        {children}
      </section>
    </main>
  );
}
