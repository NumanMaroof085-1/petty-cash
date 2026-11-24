import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDemo, store } from './store.ts';

export const sessionCookie = isDemo() ? 'pc_demo_session' : '__Host-pc_session';

export const currentProfile = cache(async () => {
  const token = (await cookies()).get(sessionCookie)?.value;
  return token ? store().sessionProfile(token) : undefined;
});

export async function requireProfile() {
  const profile = await currentProfile();
  if (!profile) redirect('/sign-in');
  return profile;
}
