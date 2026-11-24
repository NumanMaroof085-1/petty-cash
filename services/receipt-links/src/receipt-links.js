'use strict';

const { createHash, createHmac, timingSafeEqual } = require('node:crypto');

const approved = 123140001;
const maxReceiptBytes = 10 * 1024 * 1024;
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const pdfMagic = Buffer.from('%PDF-');
const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow'
};

// The fragment is sent in the POST body, so normal request URL logs do not
// capture the token. This page includes no third-party scripts or network calls.
const downloadScript = [
  'const token = location.hash.slice(1);',
  'history.replaceState(null, "", location.pathname);',
  'if (token) {',
  '  document.querySelector("input").value = token;',
  '  document.querySelector("form").submit();',
  '} else {',
  '  document.querySelector("p").textContent = "This receipt link is missing or incomplete.";',
  '}'
].join('\n');
const scriptHash = createHash('sha256').update(downloadScript).digest('base64');

function readSettings(env) {
  function httpsOrigin(name) {
    const url = new URL(env[name]);
    if (url.protocol !== 'https:' || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error(name + ' must be a bare HTTPS origin.');
    }
    return url.origin;
  }

  const dataverseOrigin = httpsOrigin('DATAVERSE_ORIGIN');
  if (!new URL(dataverseOrigin).hostname.endsWith('.dynamics.com')) {
    throw new Error('DATAVERSE_ORIGIN must be a Dataverse Dynamics hostname.');
  }
  const publicOrigin = httpsOrigin('RECEIPT_PUBLIC_ORIGIN');
  const key = Buffer.from(env.RECEIPT_SIGNING_KEY_BASE64 || '', 'base64');
  if (key.length !== 32 || key.toString('base64') !== env.RECEIPT_SIGNING_KEY_BASE64) {
    throw new Error('RECEIPT_SIGNING_KEY_BASE64 must encode 32 random bytes in Base64.');
  }
  const ttlSeconds = Number(env.RECEIPT_LINK_TTL_SECONDS ?? 604800);
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 2592000) {
    throw new Error('RECEIPT_LINK_TTL_SECONDS must be between 60 and 2592000.');
  }
  return { dataverseOrigin, publicOrigin, key, ttlSeconds };
}

function unavailable() {
  return { status: 404, headers: privateHeaders, body: 'This receipt link is unavailable or has expired.' };
}

function temporaryFailure() {
  return { status: 502, headers: privateHeaders, body: 'The receipt could not be loaded. Try again later.' };
}

async function preparePdfStream(body) {
  const reader = body.getReader();
  const preview = [];
  let bytes = 0;
  try {
    while (bytes < pdfMagic.length) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxReceiptBytes) break;
      preview.push(value);
    }
    if (bytes > maxReceiptBytes ||
        !Buffer.concat(preview, pdfMagic.length).equals(pdfMagic) || bytes < pdfMagic.length) {
      await reader.cancel();
      return null;
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  return new ReadableStream({
    async pull(controller) {
      if (preview.length) {
        controller.enqueue(preview.shift());
        return;
      }
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      bytes += value.byteLength;
      if (bytes > maxReceiptBytes) {
        controller.error(new Error('Receipt stream exceeded its size limit.'));
        await reader.cancel();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) { return reader.cancel(reason); }
  });
}

function createReceiptHandlers(settings, { getAccessToken, fetchResponse = fetch, now = Date.now }) {
  function sign(requestId, expires) {
    return createHmac('sha256', settings.key)
      .update('petty-cash-receipt-v1\n' + requestId + '\n' + expires)
      .digest('base64url');
  }

  function verifiedRequestId(token) {
    if (typeof token !== 'string' || token.length > 100) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [requestId, expires, signature] = parts;
    if (!guidPattern.test(requestId) || !/^\d{1,10}$/.test(expires) ||
        !/^[A-Za-z0-9_-]{43}$/.test(signature) ||
        Number(expires) <= Math.floor(now() / 1000)) return null;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(sign(requestId, expires))) ? requestId : null;
  }

  async function issue(request) {
    let input;
    try { input = await request.json(); }
    catch { input = null; }
    const requestId = typeof input?.requestId === 'string' ? input.requestId.toLowerCase() : '';
    if (!guidPattern.test(requestId)) {
      return { status: 400, headers: privateHeaders, jsonBody: { error: 'A valid requestId is required.' } };
    }

    const expires = Math.floor(now() / 1000) + settings.ttlSeconds;
    const link = new URL('/api/receipts/download', settings.publicOrigin);
    link.hash = [requestId, expires, sign(requestId, expires)].join('.');
    return {
      status: 200,
      headers: privateHeaders,
      jsonBody: { url: link.href, expiresAt: new Date(expires * 1000).toISOString() }
    };
  }

  async function download(request) {
    if (request.method === 'GET') {
      return {
        status: 200,
        headers: {
          ...privateHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "default-src 'none'; script-src 'sha256-" + scriptHash +
            "'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
        },
        body: '<!doctype html><html lang="en"><meta charset="utf-8"><title>Petty Cash receipt</title>' +
          '<p>Preparing your receipt…</p><noscript>This download needs JavaScript.</noscript>' +
          '<form method="post" action="/api/receipts/download"><input type="hidden" name="token"></form>' +
          '<script>' + downloadScript + '</script></html>'
      };
    }

    if (request.headers.get('content-type')?.split(';')[0] !== 'application/x-www-form-urlencoded') {
      return unavailable();
    }
    let form;
    try { form = await request.text(); }
    catch { return unavailable(); }
    if (form.length > 256) return unavailable();
    const requestId = verifiedRequestId(new URLSearchParams(form).get('token'));
    if (!requestId) return unavailable();

    try {
      const signal = AbortSignal.timeout(30000);
      const accessToken = await getAccessToken(settings.dataverseOrigin + '/.default', signal);
      if (!accessToken) return temporaryFailure();

      const row = settings.dataverseOrigin + '/api/data/v9.2/hr_pettycashrequests(' + requestId + ')';
      const headers = { Authorization: 'Bearer ' + accessToken };
      const metadata = await fetchResponse(row + '?$select=hr_approvalstatus', {
        headers: { ...headers, Accept: 'application/json' }, redirect: 'error', signal
      });
      if (!metadata.ok) {
        await metadata.body?.cancel();
        return metadata.status === 404 ? unavailable() : temporaryFailure();
      }
      if ((await metadata.json()).hr_approvalstatus !== approved) return unavailable();

      const file = await fetchResponse(row + '/hr_receiptimage/$value', { headers, redirect: 'error', signal });
      const size = Number(file.headers.get('x-ms-file-size') || file.headers.get('content-length') || 0);
      if (file.status !== 200 || !file.body || size > maxReceiptBytes) {
        await file.body?.cancel();
        return [204, 404].includes(file.status) || size > maxReceiptBytes ? unavailable() : temporaryFailure();
      }
      const stream = await preparePdfStream(file.body);
      if (!stream) return unavailable();
      return {
        status: 200,
        headers: {
          ...privateHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="petty-cash-receipt.pdf"'
        },
        body: stream
      };
    } catch {
      return temporaryFailure();
    }
  }

  return { issue, download };
}

module.exports = { readSettings, createReceiptHandlers };
