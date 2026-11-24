'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UnconfirmedError, UserError } from '../lib/contracts.ts';
import { validGuid } from '../lib/dataverse-client.ts';
import { parseExpense } from '../lib/expenses.ts';
import { emailAddress } from '../lib/live-accounts.ts';
import { mailEnabled, sendAccessCode } from '../lib/mail.ts';
import { requireProfile, sessionCookie } from '../lib/session.ts';
import { isDemo, store } from '../lib/store.ts';

type State = { error?: string; message?: string; retryOnly?: boolean };

function input(form: FormData, field: string) {
  const value = form.get(field);
  return typeof value === 'string' ? value : '';
}

export async function activateAccount(_previous: State, form: FormData): Promise<State> {
  const email = input(form, 'email').trim().toLowerCase();
  const code = input(form, 'code').trim();
  const password = input(form, 'password');
  if (password.length < 12 || password.length > 128) return { error: 'Use a password of 12–128 characters.' };
  if (password !== input(form, 'confirmPassword')) return { error: 'The passwords do not match.' };
  try {
    if (!await store().activate(email, code, password)) return { error: 'The email and invitation code do not match an active invitation.' };
  } catch { return { error: 'Activation is temporarily unavailable.' }; }
  redirect('/sign-in?activated=1');
}

export async function signIn(_previous: State, form: FormData): Promise<State> {
  let session;
  try { session = await store().signIn(input(form, 'email').trim().toLowerCase(), input(form, 'password')); }
  catch { return { error: 'Sign-in is temporarily unavailable.' }; }
  if (!session) return { error: 'Sign-in failed. Check your email and password, or try again in 15 minutes.' };
  const jar = await cookies();
  const previous = jar.get(sessionCookie)?.value;
  if (previous) await store().signOut(previous);
  jar.set(sessionCookie, session.token, {
    httpOnly: true, sameSite: 'lax', path: '/', expires: new Date(session.expires),
    secure: !isDemo() || process.env.PC_COOKIE_SECURE === '1'
  });
  redirect('/requests');
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) {
    try { await store().signOut(token); }
    catch { console.error('App session revocation failed during sign-out.'); }
  }
  jar.set(sessionCookie, '', { expires: new Date(0), httpOnly: true, sameSite: 'lax', path: '/',
    secure: !isDemo() || process.env.PC_COOKIE_SECURE === '1' });
  redirect('/sign-in');
}

export async function submitExpense(_previous: State, form: FormData): Promise<State> {
  const profile = await requireProfile();
  let expense;
  try { expense = await parseExpense(form); }
  catch (error) { return { error: error instanceof Error ? error.message : 'Check the request fields.' }; }
  let requestId: string;
  try {
    requestId = await store().createRequest(profile, expense);
  } catch (error) {
    if (error instanceof UserError && !(error instanceof UnconfirmedError)) return { error: error.message };
    return { error: 'The request could not be confirmed. Keep this page open and retry the same request.', retryOnly: true };
  }
  revalidatePath('/requests');
  redirect('/requests?saved=' + requestId);
}

export async function requestReset(_previous: State, form: FormData): Promise<State> {
  const email = emailAddress(input(form, 'email'));
  if (!email) return { error: 'Enter an email address.' };
  if (!mailEnabled()) return { error: 'Account email is unavailable. Contact your administrator for help.' };
  try {
    const code = await store().issueReset(email);
    if (code) await sendAccessCode(email, code, 'reset-password');
  } catch { /* Use the same response for nonexistent and existing accounts. */ }
  return { message: 'If this address has an active account, you’ll receive a one-time code.' };
}

export async function resetPassword(_previous: State, form: FormData): Promise<State> {
  const password = input(form, 'password');
  if (password.length < 12 || password.length > 128) return { error: 'Use a password of 12–128 characters.' };
  if (password !== input(form, 'confirmPassword')) return { error: 'The passwords do not match.' };
  try {
    const success = await store().resetPassword(emailAddress(input(form, 'email')), input(form, 'code').trim(), password);
    if (!success) return { error: 'The email and reset code do not match an active reset request.' };
  } catch { return { error: 'Password recovery is temporarily unavailable.' }; }
  (await cookies()).delete(sessionCookie);
  redirect('/sign-in?reset=1');
}

function userError(error: unknown, fallback: string): State {
  return error instanceof UserError ? { error: error.message, retryOnly: error instanceof UnconfirmedError } : { error: fallback };
}

export async function submitAnswer(_previous: State, form: FormData): Promise<State> {
  const profile = await requireProfile();
  const answer = input(form, 'answer').trim();
  if (!answer || answer.length > 4000) return { error: 'Enter an answer of up to 4,000 characters.' };
  try { await store().answerClarification(profile, validGuid(input(form, 'questionId')), answer); }
  catch (error) { return userError(error, 'The answer could not be submitted.'); }
  revalidatePath('/requests');
  redirect('/requests?answered=1');
}

export async function submitMovement(_previous: State, form: FormData): Promise<State> {
  const profile = await requireProfile();
  const type = input(form, 'movement');
  const raw = input(form, 'amount').trim();
  const notes = input(form, 'notes').trim();
  const amount = Math.round(Number(raw) * 100);
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw) || amount <= 0 || !notes || notes.length > 100 || input(form, 'confirm') !== 'on' ||
      (type !== 'cash_given' && type !== 'cash_returned')) {
    return { error: 'Choose a movement, enter a positive amount and reason, and confirm the cash was given or returned.' };
  }
  let employeeId: string;
  try {
    employeeId = validGuid(input(form, 'employeeId'));
    await store().postCash(profile, { employeeId, type, amount, notes, postingKey: validGuid(input(form, 'postingKey')) });
  } catch (error) { return userError(error, 'The cash movement could not be recorded.'); }
  revalidatePath('/finance');
  redirect('/finance?posted=1&employee=' + employeeId);
}

export async function createEmployee(_previous: State, form: FormData): Promise<State> {
  const profile = await requireProfile();
  const firstName = input(form, 'firstName').trim(), lastName = input(form, 'lastName').trim();
  const email = emailAddress(input(form, 'email')), role = input(form, 'role');
  const domain = (process.env.PC_WORK_EMAIL_DOMAIN || 'industrad.com').toLowerCase();
  if (!firstName || !lastName || firstName.length > 50 || lastName.length > 50 || !email ||
      (!isDemo() && !email.endsWith('@' + domain)) || (role !== 'employee' && role !== 'manager' && role !== 'finance')) {
    return { error: 'Enter valid names, a company email address, and a role.' };
  }
  try {
    await store().createContact(profile, { firstName, lastName, email, role,
      departmentId: validGuid(input(form, 'departmentId')), managerId: validGuid(input(form, 'managerId')) });
  } catch (error) { return userError(error, 'The Contact could not be created. Check the directory before trying again.'); }
  revalidatePath('/admin');
  redirect('/admin?created=1');
}

export async function issueInvitation(_previous: State, form: FormData): Promise<State> {
  const actor = await requireProfile();
  if (actor.role !== 'admin') return { error: 'You do not have access to this action.' };
  try {
    const { contact, code } = await store().inviteContact(actor, validGuid(input(form, 'contactId')));
    if (mailEnabled()) {
      try {
        await sendAccessCode(contact.email, code, 'activate');
        return { message: 'Invitation email queued for ' + contact.email + '.' };
      } catch { /* The issued code can be delivered privately by this administrator. */ }
    }
    return { message: 'Give ' + contact.email + ' this private one-time activation code: ' + code };
  } catch (error) { return userError(error, 'An invitation could not be issued.'); }
}
