# Finance self-posting restriction

Updated 2026-10-31. Policy for the requested next change: another authorized
Finance user must record BOTH cash given to and cash returned by the operator.
Own balance/history viewing remains allowed. This applies to every Finance
caller, including a Contact who also holds an Admin role; no client override.
It does not block an employee submitting their normal expense request.

## Website implementation

`pettycash-modules.js` is now `finance-posting-v4`:

- Keep the signed-in Finance Contact selectable for balance/history viewing.
- Selecting that Contact disables the cash fields/confirmation/post button,
  hides movement estimates and displays an explanatory note.
- Balance/history Refresh and selection of other employees remain available.
- `postMovement` compares normalized recipient and signed-in Contact GUIDs
  before generating an operation key, obtaining a CSRF token or making a POST.
  Calling this helper directly cannot bypass the self restriction.
- The new notice is in canonical Finance HTML. The helper creates it when
  needed on the existing published HTML, so a full page replacement is not
  required and the live page's existing flow ID/config can be preserved.

The browser identity/role fields are cosmetic. Direct native flow invocation
can bypass the page, so the server condition below is REQUIRED. Local frontend
implementation does not prove tenant-side enforcement.

## One required condition in the existing Finance flow

Edit **Petty Cash - Finance Cash Movement**, NOT the manager approval flow.
Inside **Actor_Is_Active > If yes**, insert Control > Condition as the FIRST
action, before Input_Movement and all key lookup/create/recovery steps.
Name it **Is_Self_Posting**.

Left side, Expression / fx:

```text
equals(
  toLower(string(body('Get_Employee')?['contactid'])),
  toLower(string(body('Get_Actor')?['contactid']))
)
```

Operator: **is equal to**. Right side, Expression: **true** (Boolean).

This compares native Contact lookup results. Get_Actor must still use the
trusted trigger User ID/vActorId; never compare against a browser-supplied
actor ID, email address, fullname or Contact business-role choice.

### If yes: reject the self movement

COPY an existing EARLY rejection Return value(s) to Power Pages (for example
the inactive-employee rejection) so its six output schemas stay identical.
Rename the copy **Reject_Self_Posting**. Values:

| Output | Type | Value |
| --- | --- | --- |
| status | Text | rejected |
| postingKey | Text | Trigger postingKey dynamic-content token |
| employeeId | Text | Trigger employeeId dynamic-content token |
| transactionId | Text | Expression '' |
| balance | Number | 0 |
| message | Text | Another Finance user must record cash movements for your account. |

Use TRIGGER tokens for postingKey/employeeId: Posting_Key and Employee_Id
Compose actions have not run at this early point. Do not copy future-output
references from Unconfirmed_Posting without replacing them. Do not add/remove
outputs or change their types; Number balance remains only a schema placeholder.

Directly below this response, INSIDE the same Yes branch, add Control >
Terminate, Status **Succeeded**. The explicit rejected response communicates
the decision; Terminate prevents the later create/recovery actions from running.

### If no: continue the existing flow

Leave No empty. Keep Input_Movement and the remaining existing actions BELOW
the WHOLE Is_Self_Posting condition, inside Actor_Is_Active Yes. Do not put
those actions inside Is_Self_Posting Yes. Keep their successful Run after;
the prohibited branch ends the run before this continuation.

```text
Actor_Is_Active > Yes
  Is_Self_Posting
    Yes: Reject_Self_Posting -> Terminate Succeeded
    No:  empty
  Input_Movement
  ...existing validation, Find_Key, Create_Cash and Resolve_Posting...
```

No table/column/web role/site setting or approval action needs adding for this
rule. Native Finance-only flow authorization remains in place independently.

## Deployment and checks

1. Add/save the server condition first. Assistant has no tenant connector; this
   is a manual step, not an implemented tenant action.
2. Replace the existing Petty Cash Modules Web Template's JavaScript with the
   complete updated pettycash-modules.js inside ONE script wrapper. Preserve
   the Finance page's current flow ID and configuration. Optional canonical
   HTML note is backward compatible; do not reset configuration by pasting a
   disabled example over the working page.
3. After resolving any existing unconfirmed operation, hard refresh the Finance
   page. Check `PettyCashModules.version` returns `finance-posting-v4`.
4. Select own Contact: history/balance/Refresh work, cash inputs and Post are
   disabled, notice shown. Select another employee: normal validated posting
   is available. Do not create unnecessary financial rows just to test the UI.
5. Verify native flow self-call rejection in the tenant for BOTH movement
   types. Expect rejected, no new Cash Transaction and no balance change. UI
   tests alone do not demonstrate server-side enforcement.

Local checks: 132 unit tests, 13 mocked Finance browser states and 4 shared-page
browser states pass. Tests include direct helper calls, self viewing, another
employee selection, duplicate script includes and old page HTML without the
new notice. An initial browser-test assertion used isDisabled on a fieldset;
it was corrected to inspect fieldset.disabled plus an actual input's behavior.

2026-10-31 update: user reports adding the server condition and publishing the
new v4 script. Installation is user-reported complete; native self-call denial
and zero-row-change tests are not independently verified. No new tenant write
or test was performed by the assistant for this status update.

References:
- [Power Automate conditions](https://learn.microsoft.com/en-us/power-automate/add-condition)
- [Expression functions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- [Native site flow role authorization](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
