# Dataverse receipt links for Business Central

The approval flow requests one expiring link per request, then reuses it on every
Business Central line. The original PDF stays in the Dataverse Request file
column. The service streams the file from Dataverse when someone opens the link.
An unapproved or missing Request, invalid signature, or expired link is denied.

## Azure and Dataverse

1. Use an Azure Function App in the company's tenant, with Azure Functions v4,
   Node.js 22, and **HTTPS Only** enabled. Enable its system-assigned managed
   identity, or attach a user-assigned identity. The public download endpoint
   must be reachable without interactive sign-in. Use a dedicated app so any
   app-wide access choices apply just to receipt links.
2. In the Power Platform admin center, open the target environment, then
   **Settings → Users + permissions → Application users → New app user**.
   Add the Azure identity using its **Application (client) ID** rather than
   its object or principal ID. Assign an application-user role with Read on
   Petty Cash Request at the scope needed for approved requests and read
   access to its receipt file column. Keep the identity read-only.
3. Configure the Azure Function App environment variables below. Generate the
   signing key directly into company-controlled secret storage as 32 bytes
   from a cryptographic random generator, encoded in standard Base64. It can
   be provided as a Key Vault reference. Keep it out of the flow, the code,
   deployment artifacts and chat.

| App setting | Value |
| --- | --- |
| DATAVERSE_ORIGIN | Bare Dataverse environment origin, such as https://orgc513a088.crm15.dynamics.com |
| RECEIPT_PUBLIC_ORIGIN | Bare HTTPS origin of the Function App that users will open |
| RECEIPT_SIGNING_KEY_BASE64 | Secret Base64-encoded signing key |
| RECEIPT_LINK_TTL_SECONDS | Optional. Defaults to 604800 (7 days). Accepts 60 to 2592000. |
| RECEIPT_MANAGED_IDENTITY_CLIENT_ID | Set the user-assigned identity client ID when using that mode. Leave unset for system-assigned identity. |
| FUNCTIONS_REQUEST_BODY_SIZE_LIMIT | Set to 4096 on this dedicated app. Both incoming request bodies are small, and the PDF streams in the response. |

4. Publish this folder to the configured Function App with a remote build,
   for example using Azure Functions Core Tools from this directory:

       func azure functionapp publish <app-name> --build remote

5. Create or copy a **function-level key for IssueReceiptLink only**. Configure
   it as a secret for the Power Automate action. The signing key and the
   function key are separate. Locally, Core Tools disables key checks by default,
   so verify the issuer returns 401 or 403 without the key on the deployed app.

## Power Automate

In each applicable final approved path, above **Apply to each** for the
Business Central export, add an **HTTP** action and name it
**Issue Receipt Link**. Configure:

- Method **POST**
- URI **https://<function-app-host>/api/receipts/link**
- Header **Content-Type** set to **application/json**
- Header **x-functions-key** supplied by your secret configuration
- Body with one property, **requestId**, set to the current Request's
  Dataverse GUID

For example, the body uses the existing Get Review Request action:

       {"requestId":"@{body('Get_Review_Request')?['hr_pettycashrequestid']}"}

On the HTTP action turn on **Secure inputs** and **Secure outputs**. In the
Business Central **Create record (V3)** action inside the loop, set
**Attachment Link** to the issuing HTTP action's **body.url**. If that action's
internal name is Issue_Receipt_Link, the expression is:

       body('Issue_Receipt_Link')?['url']

Use the actual action name for each final path. The issuer responds with
**url** and **expiresAt**. Secure inputs on downstream actions that carry the
link, including the BC create action, to limit exposure in run history. Keep
the HTTP action outside the line-item loop.

The URL stores the token in a fragment. A small page sends that token in the
download POST body so standard server request URL logs do not capture it.
Keep request body logging off. Only distribute the link to intended recipients.
Anyone who holds it can use it during its lifetime. Rotation of the signing
key invalidates existing links. To restore access after expiry, an authorized
caller can issue a fresh link for the same Request and update the BC records.
Issuing a replacement does not require rerunning approval or cash posting.

Issuance can occur after the final approver's decision and before the existing
Dataverse approval-status update. The link starts serving the PDF only once the
Request status is Approved. Keep the existing approval update and ledger
actions outside the item loop.

## Validate

- Run **npm test** from this directory for local checks with mock Dataverse data.
- In a test environment, make an approved request with two items. Check both BC
  rows carry the same link and confirm they open the same PDF in a private
  browser without signing in. Verify the BC URL field preserves the fragment.
- Verify a pending or rejected Request, a modified token, and an expired link
  do not return the file. Use a temporary 60-second expiry in the test app.
- Verify a caller without the issuer's Azure function key cannot generate a link.

[Azure Functions HTTP triggers](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger)
· [Dataverse application users](https://learn.microsoft.com/en-us/power-platform/admin/manage-application-users)
· [Power Automate secure inputs and outputs](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/use-secure-inputs-outputs-triggers)
