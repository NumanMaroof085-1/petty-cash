'use strict';

const { app } = require('@azure/functions');
const { ManagedIdentityCredential } = require('@azure/identity');
const { createReceiptHandlers, readSettings } = require('./receipt-links');

app.setup({ enableHttpStream: true });

const settings = readSettings(process.env);
const credential = process.env.RECEIPT_MANAGED_IDENTITY_CLIENT_ID
  ? new ManagedIdentityCredential({ clientId: process.env.RECEIPT_MANAGED_IDENTITY_CLIENT_ID })
  : new ManagedIdentityCredential();
const handlers = createReceiptHandlers(settings, {
  async getAccessToken(scope, abortSignal) {
    return (await credential.getToken(scope, { abortSignal }))?.token;
  }
});

app.http('IssueReceiptLink', {
  route: 'receipts/link',
  methods: ['POST'],
  authLevel: 'function',
  handler: handlers.issue
});

app.http('DownloadReceipt', {
  route: 'receipts/download',
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: handlers.download
});
