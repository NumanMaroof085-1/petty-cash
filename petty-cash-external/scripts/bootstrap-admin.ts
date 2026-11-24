import { guidPattern } from '../lib/contracts.ts';
import { liveStore } from '../lib/store.ts';

const contactId = process.argv[2];
if (!contactId || !guidPattern.test(contactId)) {
  console.error('Run node --env-file=.env.local scripts/bootstrap-admin.ts CONTACT_GUID');
  process.exitCode = 1;
} else {
  try {
    const { contact, code } = await liveStore().bootstrapAdmin(contactId.toLowerCase());
    console.log('Activation email ' + contact.email);
    console.log('One-time activation code, expires in 24 hours');
    console.log(code);
  } catch {
    console.error('Admin activation could not be issued. Check the Contact, application permissions, and server configuration.');
    process.exitCode = 1;
  }
}
