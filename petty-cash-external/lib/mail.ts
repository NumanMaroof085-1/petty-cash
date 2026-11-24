import { makeCompanyIdentity, required } from './dataverse-client.ts';
import { isDemo } from './store.ts';

export function mailEnabled() {
  return !isDemo() && Boolean(process.env.PC_AUTH_MAILBOX);
}

let tokenFor: ReturnType<typeof makeCompanyIdentity> | undefined;

export async function sendAccessCode(email: string, code: string, kind: 'activate' | 'reset-password') {
  if (!mailEnabled()) throw new Error('Account email delivery is disabled.');
  const origin = new URL(required('PC_WEB_ORIGIN'));
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Set PC_WEB_ORIGIN to the public HTTPS origin.');
  }
  tokenFor ??= makeCompanyIdentity();
  const token = await tokenFor('https://graph.microsoft.com/.default');
  const url = new URL('/' + kind, origin).href;
  const response = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(required('PC_AUTH_MAILBOX')) + '/sendMail', {
    method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000),
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: kind === 'activate' ? 'Activate your Industrad Petty Cash account' : 'Industrad Petty Cash password reset',
        body: { contentType: 'Text', content: 'Open ' + url + ' and enter your work email and this one-time code: ' + code },
        toRecipients: [{ emailAddress: { address: email } }]
      }
    })
  });
  if (response.status !== 202) throw new Error('The email service did not accept the message.');
}
