'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type State = { error?: string; message?: string; retryOnly?: boolean };
type Action = (previous: State, payload: FormData) => Promise<State>;

export function ActionForm({ action, label, saving, children, prepare }: {
  action: Action; label: string; saving: string; children: ReactNode;
  prepare?: (data: FormData) => Promise<void>;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const [ready, setReady] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [preparationError, setPreparationError] = useState('');
  const preparingRef = useRef(false);
  const lastSubmission = useRef<FormData | null>(null);
  useEffect(() => { setReady(true); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || preparingRef.current) return;
    const data = state.retryOnly ? lastSubmission.current : new FormData(event.currentTarget);
    if (!data) return;
    setPreparationError('');
    if (prepare && !state.retryOnly) {
      preparingRef.current = true;
      setPreparing(true);
      try { await prepare(data); }
      catch (error) {
        setPreparationError(error instanceof Error ? error.message : 'Could not prepare the form.');
        return;
      } finally { preparingRef.current = false; setPreparing(false); }
    }
    lastSubmission.current = data;
    startTransition(() => dispatch(data));
  }

  return (
    <form method="post" onSubmit={submit} className="form" aria-busy={pending || preparing}>
      <fieldset disabled={!ready || pending || preparing || state.retryOnly} className="fields">
        {children}
      </fieldset>
      {(preparationError || state.error) && <p role="alert" className="feedback error">{preparationError || state.error}</p>}
      {state.message && <p role="status" className="feedback success" style={{ overflowWrap: 'anywhere' }}>{state.message}</p>}
      <button type="submit" disabled={!ready || pending || preparing}>
        {preparing ? 'Preparing…' : pending ? saving : state.retryOnly ? 'Retry same submission' : label}
      </button>
    </form>
  );
}
