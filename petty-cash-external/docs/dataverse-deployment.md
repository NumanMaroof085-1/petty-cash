# Dataverse and Power Automate deployment

Start in a company test environment using the unmanaged **Pettycashwebapp 1.0.0.1** export as the schema and workflow reference. Leave the existing website available during testing. Keep its flow endpoints and role permissions in place until the company decides to switch over.

## 1. Create the backend identity and schema

Create a single-tenant Microsoft Entra app registration for the hosted backend, then add it as a Dataverse **application user** in the target environment. Use a dedicated Dataverse security role. The Next.js server uses the application identity and separately authorizes each signed-in employee. Keep credentials and flow endpoints in the host's secret settings.

| Dataverse table | Backend privileges |
| --- | --- |
| Contact | Organization read and create. Grant the Append and Append To privileges required for manager, department, and request relationships. |
| Departments | Organization read and Append To for Contact and Request lookups. |
| Petty Cash Request | Organization read, create, write, Append and Append To for the request header, receipt file, and linked items. |
| Petty Cash Line Item | Organization read, create and Append. Verify create-only conditional upsert with the target connector and security role. |
| Cash Transaction and Request Clarification | Organization read. The respective flow connection handles updates. |
| Transaction Currency | Read and the relationship privileges required for the request and item currency lookups. |
| The three private app tables below | Organization read, create and write. Reserve cleanup privileges for an operator. |

For the custom schema, use a solution publisher with prefix `pc`. Enable optimistic concurrency on the standard, organization-owned app tables. Use the logical names and text lengths shown. All three primary name columns are `pc_name` (text, at least 100 characters). Dataverse supplies the primary GUID columns. Use **Date and Time** columns for expirations.

| Table | Exact entity set | Columns beyond primary name and ID |
| --- | --- | --- |
| App Account (`pc_appaccount`) | `pc_appaccounts` | `pc_contactid` text 36, `pc_emailkey` text 64, `pc_role` text 16, `pc_enabled` Yes/No, `pc_passwordhash` text 128, `pc_invitehash` text 64, `pc_inviteexpires` date/time, `pc_resethash` text 64, `pc_resetexpires` date/time, `pc_revision` text 36 |
| App Session (`pc_appsession`) | `pc_appsessions` | `pc_accountid` text 36, `pc_tokenhash` text 64, `pc_revision` text 36, `pc_expires` date/time |
| App Throttle (`pc_appthrottle`) | `pc_appthrottles` | `pc_started` date/time, `pc_count` whole number |

Add separate alternate keys for App Account's `pc_contactid` and `pc_emailkey` and verify both are **Active**. Give access to these tables only to the backend and the designated Dataverse operators. Leave the power pages identity columns on Contact for the existing portal. The standalone app uses its own password hashes and sessions.

Add these two columns to **Petty Cash Request** using the same publisher prefix:

- `pc_submissionstate` (Whole Number, optional, blank default). Existing rows stay blank. A new app request is written with 0, then marked 1 once its lines and PDF are saved.
- `pc_submissionsignature` (text, max length 64, optional). The server uses this value to verify that a retry contains the original details.

Verify the role's privileges with integration tests, since metadata and lookup navigation names can differ between environments. The export uses `hr_branch` on Contact, Request, and Cash Transaction. Lahore is `123140000` and Karachi is `123140001`. Check existing branch data before rollout. Finance views other employees' transactions for their shared branch and an employee's own balance includes their full ledger. Confirm the intended payment-source mapping in the test environment. The export has Own Pocket `123140000` and Company Cash `123140001`. The Line Item quantity field stores two decimal places.

## 2. Adapt the flows

**ManagerApprovalBC.** Keep the Dataverse Added or Modified trigger and the Select columns value `hr_workflowstage`. Update **Filter rows** to the following, then save and test with submission disabled at the web host.

```text
(pc_submissionstate eq null or pc_submissionstate eq 1) and hr_approvalstatus eq 123140000 and (hr_workflowstage eq 123140000 or hr_workflowstage eq 123140003 or hr_workflowstage eq 123140006)
```

Verify that a row at state 0 creates zero approval runs and a transition to 1 creates one. The old portal's null state and resumed manager/boss stages remain eligible. Verify the manager's current approval, the boss path for amounts **above PKR 10,000**, clarification continuation, rejection, and single expense posting. Review receipt access in the approval and the company's Business Central mappings. Business Central should receive one row per line item after final approval with the required branch and unit. The company owns the current connector and mapping changes.

**Clarification Notification.** Keep the Dataverse trigger and conditions. Update the employee email link to `https://YOUR-APP-HOST/requests` for the standalone deployment. Keep the test and live notification destinations appropriate to their environment.

**Finance Cash Movement** and **Submit Clarification Answer.** Create two copies for the external app. Use **When an HTTP request is received**, choose **Specific users in my tenant**, and enter the backend app's **service principal object ID** from Enterprise Applications. The HTTP endpoint should accept a bearer token only from that service principal. Configure the copied actions with approved Dataverse connection references and use regular HTTP **Response** actions with `application/json`. Confirm authenticated HTTP trigger support in the tenant before enabling posting.

| Input from server | Finance legacy mapping | Clarification legacy mapping |
| --- | --- | --- |
| `callerContactId` | Replace `triggerBody()?['userId']` or `triggerBody()['userId']` wherever used as the actor / Recorded By Contact | `Input_Caller` |
| `employeeId` | `text` | |
| `movement` | `text_1` (`cash_given` or `cash_returned`) | |
| `amount` | `number` (PKR amount) | |
| `notes` | `text_2` | |
| `postingKey` | `text_3` | |
| `clarificationId` | | `Input_Clarification` (`text`) |
| `answer` | | `Input_Answer` (`text_1`) |

Change each flow reference to the relevant new key, for example `triggerBody()?['callerContactId']`. Set all columns in the table above that belong to the respective flow as required in its HTTP JSON schema. Use JSON type `number` for amount and `string` for the other inputs. Keep the flow-side validation and attribution, the existing Finance posting-key uniqueness, and the clarification ownership, stage and round checks. Finance must verify active same-branch Contacts, the finance business role, and that employee and actor differ. For clarification, verify a matching already-saved answer is reportable as answered after a transient response failure and that it only requeues the same review once.

Successful Finance HTTP 200 body:

```json
{"status":"posted","postingKey":"<input key>","employeeId":"<employee GUID>","transactionId":"<saved row GUID>"}
```

Successful clarification HTTP 200 body:

```json
{"status":"answered","clarificationId":"<matching clarification GUID>"}
```

The app also accepts the lowercased output names from the original flows. Return `status: "rejected"` with the original input identifiers for a definitively refused movement. Use `status: "unconfirmed"` if the result is uncertain so the app keeps the original key for retry. Run the copied flows with the original Power Pages flows still available for rollback. Verify an HTTP call without the backend identity is denied. The default scope covers Power Automate's public-cloud audience of `https://service.flow.microsoft.com/`.

## 3. Configure and start the host

Copy `.env.example` to the host's environment settings or to a local ignored `.env.local` for an operator test. Start with `PC_SUBMISSION_GATE_CONFIRMED=0`.

- **Dataverse.** Set the environment's bare HTTPS origin in `PC_DATAVERSE_ORIGIN`, with the app registration credentials in `PC_TENANT_ID`, `PC_CLIENT_ID`, and `PC_CLIENT_SECRET`. Set `PC_CURRENCY_ID` to the target environment's active PKR Transaction Currency row GUID.
- **Workflows.** Set `PC_FINANCE_FLOW_URL` and `PC_CLARIFICATION_FLOW_URL` to the authenticated HTTP endpoints without SAS signatures. Keep these server-side.
- **Account email.** Set `PC_WEB_ORIGIN` to the external HTTPS origin. Set `PC_AUTH_MAILBOX` to the company's mailbox for activation and reset emails. Arrange organization-approved Graph send access limited to that mailbox, for example Exchange Application RBAC with the application Mail.Send role. Review overlapping application-wide permissions. Without the mailbox, Admin can pass a one-time activation code through the company’s private onboarding channel. Self-service password reset uses the configured mailbox.
- **Hosting.** Use Node.js 24 or later with HTTPS, `PC_DEMO` unset, and request bodies of at least 12 MiB permitted through the reverse proxy. Run `npm ci`, `npm run build`, and `npm run start`. The start command listens on the local interface for a reverse proxy. On a managed container that requires a public container socket, set the service start command to `npm exec -- next start --hostname 0.0.0.0`, behind the platform's HTTPS ingress. Add sign-in and password-recovery rate limits at the edge and restrict access to platform logs and secrets.

Select an active Contact with the Admin business role, a valid email, and a branch for each initial Admin. An authorized operator issues that Contact's invitation from a private terminal:

```powershell
node --env-file=.env.local scripts/bootstrap-admin.ts CONTACT_GUID
```

The operator should provide the code privately. Existing Contacts activate fresh app accounts. Finance and Admin work on the same branch as their Contact. Branch-wide Admin can issue invitations for Employee, Manager and Finance account roles. For role changes on activated accounts, a Dataverse operator should update the App Account role (`employee`, `manager`, `finance` or `admin`), update the Contact's matching business role, and rotate `pc_revision` to a fresh GUID to invalidate prior sessions. Disable access with `pc_enabled = No`. Regularly clean up expired App Session rows, stale App Throttle rows and verified abandoned request drafts using a designated operator.

## 4. Accept and switch over

1. Verify a fresh invitation, expired/reused code rejection, password reset, sign-out, and revoked access after disabling the App Account.
2. Check one test employee in each branch. Confirm they can open their own receipts, and cannot read each other's requests or receipts. Confirm that only Finance and Admin account roles can open their pages and act on their branch.
3. Verify the approval trigger readiness filter, then set `PC_SUBMISSION_GATE_CONFIRMED=1` and restart the app. Submit a two-line request with multiple receipt images. Confirm one header, two lines, one readable PDF, and one approval after the commit.
4. Test below, at, and above the threshold, plus rejection and a manager or boss clarification. Verify the reply restarts the right stage and each approved expense is posted once. Inspect the Business Central rows before accepting the cutover.
5. Test a Finance advance and return, a replay of the same posting key, a denied self-post and a denied different-branch post. Reconcile the ledger and displayed balances against Dataverse before enabling Finance for the company.
6. Record the approved website origin, connection owners, deployment version and rollback owner. For rollback, disable new submissions and external posting, keep Dataverse records, and route employees back to the original site after completing or reconciling in-flight requests. Review Microsoft licensing and capacity with the tenant owner before production.

## Microsoft references

- [Dataverse application users](https://learn.microsoft.com/en-us/power-platform/admin/manage-application-users)
- [Dataverse upsert](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/use-upsert-insert-update-record)
- [Dataverse conditional operations](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/perform-conditional-operations-using-web-api)
- [Dataverse file columns](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/file-column-data)
- [Authenticated Power Automate HTTP triggers](https://learn.microsoft.com/en-us/power-automate/oauth-authentication)
- [Microsoft Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Exchange Application RBAC](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)
