import { demoContactId, demoEmail, demoStore } from '../lib/demo-store.ts';
import { branches } from '../lib/expenses.ts';
import type { Profile } from '../lib/expenses.ts';

process.env.PC_DEMO = '1';
const db = demoStore();
try {
  const profiles: Profile[] = [
    { id: demoContactId, email: demoEmail, name: 'Demo Employee', branch: branches.Lahore, role: 'employee' },
    { id: 'a370ebdc-4eb2-4483-b4f6-fd7294e84b26', email: 'finance@pettycash.example', name: 'Demo Finance', branch: branches.Lahore, role: 'finance' },
    { id: '59c7b8b4-951b-4e0f-986b-aa58c2055a56', email: 'admin@pettycash.example', name: 'Demo Admin', branch: branches.Lahore, role: 'admin' }
  ];
  for (const profile of profiles) {
    const code = db.invite(profile);
    console.log(profile.name + ' (' + profile.email + ')');
    console.log(code ? 'One-time invitation code (24 hours): ' + code : 'Already activated. Sign in with its password.');
  }
} finally {
  db.close();
}
