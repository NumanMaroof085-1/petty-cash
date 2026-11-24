import { guidPattern } from '../../../../../lib/contracts';
import { DataverseError } from '../../../../../lib/dataverse-client';
import { store } from '../../../../../lib/store';
import { currentProfile } from '../../../../../lib/session';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [profile, { id }] = await Promise.all([currentProfile(), params]);
  let record;
  try { if (profile && guidPattern.test(id)) record = await store().receiptFor(profile.id, id); }
  catch (error) { if (!(error instanceof DataverseError && error.status === 404)) throw error; }
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  if (!record) return new Response('Receipt not found.', { status: 404, headers });
  return new Response(new Uint8Array(record.receipt).buffer, {
    headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + record.receiptName + '"' }
  });
}
