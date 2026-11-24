'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const vm = require('node:vm');
const { createReceiptHandlers, readSettings } = require('../src/receipt-links');

const requestId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const settingsEnv = {
  DATAVERSE_ORIGIN: 'https://example.crm.dynamics.com',
  RECEIPT_PUBLIC_ORIGIN: 'https://example.azurewebsites.net/',
  RECEIPT_SIGNING_KEY_BASE64: Buffer.alloc(32, 7).toString('base64'),
  RECEIPT_LINK_TTL_SECONDS: '60'
};
const initialTime = Date.parse('2026-11-23T10:00:00Z');

function fixture({ status = 123140001, fileResponse } = {}) {
  const calls = [];
  let time = initialTime;
  const handlers = createReceiptHandlers(readSettings(settingsEnv), {
    now: () => time,
    async getAccessToken(scope) { calls.push(scope); return 'mock-access-token'; },
    async fetchResponse(url, options) {
      calls.push(url);
      assert.equal(options.headers.Authorization, 'Bearer mock-access-token');
      assert.equal(options.redirect, 'error');
      if (url.endsWith('?$select=hr_approvalstatus')) return Response.json({ hr_approvalstatus: status });
      if (fileResponse) return fileResponse();
      const pdf = new ReadableStream({
        start(controller) {
          controller.enqueue(Buffer.from('%P'));
          controller.enqueue(Buffer.from('DF-1.7\n'));
          controller.enqueue(Buffer.from('%%EOF'));
          controller.close();
        }
      });
      return new Response(pdf);
    }
  });
  async function issue(id = requestId) {
    return handlers.issue({ json: async () => ({ requestId: id }) });
  }
  async function redeem(token) {
    return handlers.download(new Request('https://example.azurewebsites.net/api/receipts/download', {
      method: 'POST',
      body: new URLSearchParams({ token })
    }));
  }
  return { handlers, calls, issue, redeem, advance: milliseconds => { time += milliseconds; } };
}

test('issued URL contains the capability only in its fragment and expires as configured', async () => {
  const testApp = fixture();
  const { status, jsonBody } = await testApp.issue();
  const link = new URL(jsonBody.url);
  assert.equal(status, 200);
  assert.equal(link.origin, 'https://example.azurewebsites.net');
  assert.equal(link.pathname, '/api/receipts/download');
  assert.equal(link.search, '');
  assert.ok(link.hash.startsWith('#' + requestId + '.'));
  assert.equal(jsonBody.expiresAt, new Date(initialTime + 60000).toISOString());
  assert.deepEqual(testApp.calls, []);
});

test('landing page submits the token in a POST and clears the fragment from its address', async () => {
  const testApp = fixture();
  const link = new URL((await testApp.issue()).jsonBody.url);
  const page = await testApp.handlers.download({ method: 'GET' });
  const input = {};
  let submitted = false, cleanPath;
  const script = page.body.match(/<script>([\s\S]+)<\/script>/)[1];
  vm.runInNewContext(script, {
    location: link,
    history: { replaceState: (state, title, path) => { cleanPath = path; } },
    document: { querySelector: selector => selector === 'input' ? input : {
      submit: () => { submitted = true; }
    } }
  });
  assert.equal(page.status, 200);
  assert.match(page.body, /<form method="post" action="\/api\/receipts\/download">/);
  assert.ok(page.headers['Content-Security-Policy'].includes(
    'sha256-' + createHash('sha256').update(script).digest('base64')));
  assert.equal(input.value, link.hash.slice(1));
  assert.equal(cleanPath, '/api/receipts/download');
  assert.equal(submitted, true);
  assert.deepEqual(testApp.calls, []);
});

test('approved receipt streams directly from Dataverse with private download headers', async () => {
  const testApp = fixture();
  const token = new URL((await testApp.issue()).jsonBody.url).hash.slice(1);
  const reply = await testApp.redeem(token);
  assert.equal(reply.status, 200);
  assert.equal(reply.headers['Content-Type'], 'application/pdf');
  assert.match(reply.headers['Content-Disposition'], /^attachment;/);
  assert.equal(reply.headers['Cache-Control'], 'private, no-store');
  assert.equal(await new Response(reply.body).text(), '%PDF-1.7\n%%EOF');
  const base = settingsEnv.DATAVERSE_ORIGIN;
  const row = base + '/api/data/v9.2/hr_pettycashrequests(' + requestId + ')';
  assert.deepEqual(testApp.calls, [base + '/.default', row + '?$select=hr_approvalstatus',
    row + '/hr_receiptimage/$value']);
});

test('expired and edited links are denied before identity or Dataverse calls', async () => {
  const testApp = fixture();
  const token = new URL((await testApp.issue()).jsonBody.url).hash.slice(1);
  const [id, expiry, signature] = token.split('.');
  for (const invalid of ['', [otherId, expiry, signature].join('.'),
    [id, Number(expiry) + 1, signature].join('.'),
    [id, expiry, (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1)].join('.')]) {
    assert.equal((await testApp.redeem(invalid)).status, 404);
  }
  testApp.advance(60000);
  assert.equal((await testApp.redeem(token)).status, 404);
  assert.deepEqual(testApp.calls, []);
  assert.equal((await testApp.issue('hr_pettycashrequests')).status, 400);
});

test('pending and rejected requests do not fetch file content', async () => {
  for (const status of [123140000, 123140002, undefined]) {
    const testApp = fixture({ status: status ?? null });
    const token = new URL((await testApp.issue()).jsonBody.url).hash.slice(1);
    assert.equal((await testApp.redeem(token)).status, 404);
    assert.equal(testApp.calls.length, 2);
    assert.ok(!testApp.calls.some(url => url.endsWith('/$value')));
  }
});

test('missing, oversized and non-PDF bodies are denied', async () => {
  for (const fileResponse of [
    () => new Response(null, { status: 404 }),
    () => new Response('unsupported'),
    () => new Response('x', { headers: { 'x-ms-file-size': '10485761' } })
  ]) {
    const testApp = fixture({ fileResponse });
    const token = new URL((await testApp.issue()).jsonBody.url).hash.slice(1);
    assert.equal((await testApp.redeem(token)).status, 404);
  }
});

test('invalid origin, signing key and expiration settings fail closed', () => {
  for (const override of [
    { DATAVERSE_ORIGIN: 'https://example.org' },
    { DATAVERSE_ORIGIN: settingsEnv.DATAVERSE_ORIGIN + '/api/data/v9.2' },
    { RECEIPT_PUBLIC_ORIGIN: 'http://example.azurewebsites.net' },
    { RECEIPT_LINK_TTL_SECONDS: '0' },
    { RECEIPT_SIGNING_KEY_BASE64: 'bad-key' }
  ]) {
    assert.throws(() => readSettings({ ...settingsEnv, ...override }));
  }
});
