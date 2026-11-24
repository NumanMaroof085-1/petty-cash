import { demoStore } from './demo-store.ts';
import type { WorkspaceStore } from './contracts.ts';
import { createDataverse, makeCompanyIdentity, required } from './dataverse-client.ts';
import { createLiveAccounts } from './live-accounts.ts';
import { createLiveRequests } from './live-requests.ts';
import { createFlowClient, createLiveWorkspace } from './live-workspace.ts';

export const isDemo = () => process.env.PC_DEMO === '1';
let live: ReturnType<typeof makeLive> | undefined;

function makeLive() {
  const origin = new URL(required('PC_DATAVERSE_ORIGIN')).origin;
  const getToken = makeCompanyIdentity();
  const dv = createDataverse(required('PC_DATAVERSE_ORIGIN'), () => getToken(origin + '/.default'));
  const accounts = createLiveAccounts(dv);
  const requests = createLiveRequests(dv, accounts.contact, required('PC_CURRENCY_ID'), process.env.PC_SUBMISSION_GATE_CONFIRMED === '1');
  const workspace = createLiveWorkspace(dv, accounts.contact, createFlowClient(getToken));
  return { ...requests, ...workspace, ...accounts };
}

export function liveStore() {
  if (isDemo()) throw new Error('Live Dataverse access is disabled in demo mode.');
  live ??= makeLive();
  return live;
}

export function store(): WorkspaceStore {
  return isDemo() ? demoStore() : liveStore();
}
