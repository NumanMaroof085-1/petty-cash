# Finance cash movement flow setup

Guided-build checkpoint: the user reports the five trigger inputs and vActorId
(String, trigger User ID) added. Next instruction: add Dataverse Get a row by ID,
rename Get_Employee, Contacts, Row ID = employeeId trigger token, Select columns
contactid,fullname,statecode. This is a read-only lookup, not an active-status
validation or a cash write. No action execution/caller mapping is verified yet.
Continue one small action per turn. Later normalization/validation/error scopes
remain required; reuse/reposition this Get_Employee rather than creating another
copy when reaching section 8. vActorId now starts from User ID instead of empty;
its later normalization/verification still applies. Do not recreate confirmed
trigger inputs or list all Cash Transactions at this checkpoint.

Build one solution-aware Power Automate flow named **Petty Cash - Finance Cash
Movement**, using **When Power Pages calls a flow** in the classic designer.
This guide is a manual build recipe, not an importable flow or a deployed backend.
The user reports the Finance page working and has reached the trigger setup.
No flow run, trigger/output schema, connection privileges or currency metadata
has been inspected in the tenant. Keep the website posting switches disabled
until the final checks pass.

The flow records cash actually given to an employee or returned by an employee.
It creates an immutable Cash Transaction, calculates the signed ledger balance,
and returns that balance to the Finance page. Manager expense approvals are a
separate flow. No new balance table is required.

## 1. Prepare the existing table and one operator lookup

Use the existing mappings:

| Item | Confirmed value |
| --- | --- |
| Cash table logical name | hr_cashtransaction |
| Cash table entity set | hr_cashtransactions |
| Employee lookup | hr_employee, targeting Contact |
| Amount | hr_amount, Currency; save a positive value |
| Type | hr_transactiontype |
| Notes | hr_notespurpose, client maximum 100 characters |
| Request lookup | hr_linkedrequest; empty for Finance movements |
| Reference | hr_transactionreference; existing autonumber, leave unassigned |
| Posting key column | crec6_postingkey, schema crec6_PostingKey |
| Cash given type | 123140000 (Advance Given) |
| Cash returned type | 123140002 (Cash Returned) |
| Approved expense type | 123140001; read in the ledger, never created here |

In Power Apps > the solution > Cash Transaction > Keys, check the existing
alternate key on **crec6_postingkey** is **Active**. The column alone is not a
unique constraint. Do not recreate the older proposed hr_postingkey. Historical
Word documents still contain that older proposal; the confirmed mapping above
supersedes it. Do not delete or change historical ledger entries during setup.

Add one lookup on Cash Transaction if no equivalent operator Contact lookup
already exists:

| Setting | Value |
| --- | --- |
| Display name | Recorded By |
| Type | Lookup |
| Related table | Contact |
| Requirement | Optional at table level; mandatory in this Finance flow |
| Logical name | Copy the actual generated name after saving |

Optional at table level preserves existing history and future automated expense
rows. The Finance flow must populate it on every new Finance row. This records
the website operator; Dataverse Created By normally identifies the connection's
system user instead. Store it in the SAME create as the movement, not a later
update. Do not use the employee being paid as the operator.

Three placeholders appear below. Replace them with actual metadata, not guesses:

- `<CASH_PK>`: the Cash Transaction primary **GUID** logical name, not its
  autonumber/name column. Inspect the table columns or its primary ID metadata.
- `<RECORDED_BY>`: the saved operator lookup logical name.
- `<RECORDED_BY_VALUE>`: that lookup's read property, normally
  `_<actual logical name>_value`, verified from a connector row output.

The operator lookup and posting key are backend fields. Do not add them to the
portal Web API field list or grant portal cash Create/Write access for this flow.
Publish the table customization and refresh the connector if its fields are stale.

## 2. Flow connection and solution

Use the same environment as the website. Keep the flow inside the project's
unmanaged solution and use a Dataverse connection reference.

The connection identity needs the required Dataverse security-role privileges:
read eligible Contacts and Transaction Currency; read/create Cash Transactions;
and the Dataverse lookup association privileges needed for Employee, Recorded By
and Currency. Connection privileges are separate from portal table permissions.
It does not need Contact balance Write, Cash Transaction Update/Delete, or
password/security fields for this recipe.

If the trigger offers concurrency control, set degree of parallelism to **1**
for this small Finance flow. It serializes this flow only; it does not serialize
other flows or replace the unique key. Enabling trigger concurrency cannot simply
be undone in place, according to Microsoft. If this trigger does not expose the
setting, do not substitute another trigger; the dedupe design still relies on
the database key. Avoid parallel branches around the ledger scan.

## 3. Define the five trigger inputs

In **When Power Pages calls a flow**, add these inputs with these exact labels:

| Name | Type | Meaning |
| --- | --- | --- |
| employeeId | Text | Employee Contact GUID |
| movement | Text | cash_given or cash_returned |
| amount | Number | Positive PKR movement amount |
| notes | Text | Reason/reference, 1-100 characters after trimming |
| postingKey | Text | UUID generated by the website for this operation |

Do not add actorId, currentBalance, resultingBalance, transactionType or password
inputs. The trigger's built-in **User ID** dynamic content supplies the caller.

Inspect Peek code and record the actual input property names as well as labels.
Use dynamic-content tokens in the next section so internal names such as text_1
are never guessed. Microsoft requires request parameter names to match the
trigger definition. The current page sends the five camelCase names above.
If your trigger schema differs, reconcile the mapping before live posting;
do not silently read null properties. No trigger/output schema has been verified
from this tenant yet.

## 4. Add variables at the top level

Initialize these BEFORE any Scope, Condition or Apply to each:

| Name | Type | Initial value |
| --- | --- | --- |
| vConfirmed | Boolean | false |
| vPostingKey | String | empty |
| vEmployeeId | String | empty |
| vActorId | String | empty |
| vTransactionId | String | empty |
| vBalanceCents | Integer | 0 |
| vSeenExpenseRequests | Array | [] |
| vPostedRowSeen | Boolean | false |
| vLedgerValid | Boolean | true |

Use the action names below before pasting expressions. In Expression fields,
paste expressions without a leading @ or @{...}. In ordinary fields, insert
dynamic-content tokens rather than typing their displayed labels as text.

## 5. Build Work and Finalize scopes

Add a Scope named **Work**. Put sections 6-13 inside it in order.

After Work, add a Scope named **Finalize**. Configure its Run after on Work for
**is successful**, **has failed**, **has timed out** and **is skipped**. Inside
Finalize, return success ONLY if vConfirmed is true; otherwise return the
unconfirmed response in section 14. This catches parse, lookup, create, read and
calculation failures without a misleading success response.

The action layout is:

```text
When Power Pages calls a flow
Initialize variables (top level)
Work
  Capture inputs / Parse_Input / normalize / validate
  Get_Actor / Get_Employee / List_PKR / Find_Key
  Post_Or_Find
    If key absent: Create_Cash
    Else: no write
  Resolve_Posting   [after Post_Or_Find success, failure OR timeout]
    Resolve_Key / Saved_Row / compare original event
    List_Ledger / guard completeness
    Each_Ledger_Row (sequential; validation failures set vLedgerValid=false)
    Check ledger valid and saved row included
    Balance_Result / precision check
    Set vConfirmed = true
Finalize           [after any Work outcome]
  If vConfirmed: return posted + IDs + numeric balance
  Else: return unconfirmed
```

For validation Conditions OUTSIDE Apply to each, use this reusable rejection pattern
in each invalid branch: **Return value(s) to Power Pages** with Text outputs
`status = rejected` and a short `message`, then **Terminate** with Succeeded to
end the already-responded run. A rejected business operation is not a posted
transaction. Never place a Terminate before its rejection response: that would
prevent the response/finalizer. If validation itself throws, Finalize returns
unconfirmed. Do not return raw connector exceptions or whole Contact records.

## 6. Capture inputs and validate their structure

Inside Work, add six Compose actions:

| Action name | Input |
| --- | --- |
| Input_Employee | employeeId trigger dynamic token |
| Input_Movement | movement trigger dynamic token |
| Input_Amount | amount trigger dynamic token |
| Input_Notes | notes trigger dynamic token |
| Input_Key | postingKey trigger dynamic token |
| Input_Actor | built-in trigger User ID dynamic token |

User ID must be the platform-supplied caller, not a new browser input. Microsoft's
Power Pages image-library example uses this token as the user identity. On a
test invocation, confirm it matches the signed-in Finance Contact GUID. If it
is absent or is not a Contact identifier in this tenant, do not enable posting
or substitute a browser-provided value; resolve that identity mapping first.

Compose **Input_Object**, Expression:

```text
addProperty(addProperty(addProperty(addProperty(addProperty(json('{}'),
  'employeeId', outputs('Input_Employee')),
  'movement', outputs('Input_Movement')),
  'amount', outputs('Input_Amount')),
  'notes', outputs('Input_Notes')),
  'postingKey', outputs('Input_Key'))
```

Add **Parse JSON**, rename **Parse_Input**. Content = Input_Object output;
Schema = the entire object in finance-cash-request.schema.json. The $schema
metadata is not an action definition. It validates the five declared parameters;
additional incoming browser parameters are not trusted identity/configuration.
Test that malformed GUIDs and fractional cents are rejected by the runtime.

Compose the following, in order:

| Action | Expression |
| --- | --- |
| Employee_Id | toLower(trim(body('Parse_Input')?['employeeId'])) |
| Posting_Key | toLower(trim(body('Parse_Input')?['postingKey'])) |
| Actor_Id | toLower(trim(string(outputs('Input_Actor')))) |
| Notes | trim(body('Parse_Input')?['notes']) |
| Movement_Type | if(equals(body('Parse_Input')?['movement'], 'cash_given'), 123140000, 123140002) |

Movement_Type is used ONLY after Parse_Input has accepted the two allowed
movement values. Do not let an arbitrary third value fall into Cash Returned.

Set vEmployeeId, vPostingKey and vActorId to their normalized Compose outputs.
Parse JSON also for Actor_Id with this schema (name the action Parse_Actor):

```json
{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"}
```

Add Condition **Valid_Notes**:

```text
and(greater(length(outputs('Notes')),0),lessOrEquals(length(outputs('Notes')),100))
```

Reject the No branch with a reason-length message. Conditions described as
"reject unless" below use the same response-then-Terminate pattern. For
untrusted GUIDs, schema validation must succeed before building any OData filter.

## 7. Validate currency amounts in cents

Compose **Amount_Scaled_Text**:

```text
string(mul(decimal(string(body('Parse_Input')?['amount'])), decimal('100')))
```

Compose **Amount_Cents**:

```text
int(first(split(outputs('Amount_Scaled_Text'), '.')))
```

Condition **Valid_Amount**:

```text
and(
  greater(outputs('Amount_Cents'),0),
  lessOrEquals(outputs('Amount_Cents'),9007199254740991),
  equals(decimal(outputs('Amount_Scaled_Text')),decimal(string(outputs('Amount_Cents'))))
)
```

Reject the No branch. This rejects fractional cents rather than silently rounding
them. Decimal intermediates are deliberately preserved as strings. A decimal
parse or integer overflow is a failed validation caught by Finalize. The existing
Dataverse Currency column's minimum/maximum must ALSO be respected; inspect
hr_amount metadata and add the actual financial upper limit to Valid_Amount.
Do not invent a company cash limit. Until that metadata/limit check is completed,
the guide is not ready for production enablement.

## 8. Verify actor, employee and PKR

Add Dataverse **Get a row by ID**, name **Get_Actor**:

- Table: Contacts; Row ID = Actor_Id.
- Select columns: contactid,statecode.
- Reject unless the returned contactid equals Actor_Id and statecode is 0.

Add **Get_Employee** similarly, Row ID = Employee_Id; same selected columns;
reject unless the ID matches and statecode is 0. This uses the same active-Contact
eligibility as the Finance selector. Do not require the employee to have Finance
role, a manager or a nonnegative balance. If later policy excludes some Contacts,
apply the same eligibility policy to both selector and flow.

Add Dataverse **List rows**, name **List_PKR**:

| Setting | Value |
| --- | --- |
| Table | Transaction Currencies (transactioncurrency) |
| Select columns | transactioncurrencyid,isocurrencycode,statecode,currencyprecision |
| Filter rows | isocurrencycode eq 'PKR' and statecode eq 0 |
| Row count | 2 |

Reject unless exactly one row was returned and its currency precision is at
least 2. Compose **PKR_Id**:

```text
toLower(first(body('List_PKR')?['value'])?['transactioncurrencyid'])
```

Reject a currency/setup error rather than silently choosing the first of two
PKR rows or assuming the connection's/base currency. Also confirm hr_amount
supports two decimal places; this is separate from currency precision.

## 9. Find the existing posting key

Add Dataverse List rows named **Find_Key**:

| Setting | Value |
| --- | --- |
| Table | Cash Transactions |
| Select columns | <CASH_PK>,crec6_postingkey,_hr_employee_value,hr_amount,hr_transactiontype,hr_notespurpose,_hr_linkedrequest_value,_transactioncurrencyid_value,<RECORDED_BY_VALUE> |
| Filter rows | Expression below |
| Row count | 2 |

```text
concat('crec6_postingkey eq ''', outputs('Posting_Key'), '''')
```

Do not add `$filter=` in a connector Filter rows field. The posting key must
already be a validated UUID, preventing filter-string injection.

If more than one row returns, reject and repair the key configuration before
posting. If one returns, **do not create or update anything**. Proceed to the
common key resolution/comparison in section 11. A zero-row result permits one
create attempt in the next section.

## 10. Attempt exactly one create when the key is absent

Add Scope **Post_Or_Find** after Find_Key. Inside it add a Condition:

```text
equals(length(body('Find_Key')?['value']),0)
```

In Yes, add Dataverse **Add a new row**, name **Create_Cash**. Table: Cash
Transactions. Set its Retry policy to **None**; recovery reads by key instead of
unconditional POST retry. Populate:

| Field | Value |
| --- | --- |
| Employee (Contacts) | concat('contacts(',outputs('Employee_Id'),')') |
| Transaction Type | Movement_Type output (numeric Choice) |
| Amount | amount token from Parse_Input (already validated) |
| Notes / Purpose | Notes output |
| Posting key | Posting_Key output |
| Recorded By (Contacts) | concat('contacts(',outputs('Actor_Id'),')') |
| Currency (Transaction Currencies) | concat('transactioncurrencies(',outputs('PKR_Id'),')') |
| Linked Request | Leave empty |
| Transaction Reference | Leave empty; autonumber |

Those concat values go into the Expression editor; they are not literal text.
Use the displayed connector lookup fields, not guessed navigation-property
names. Lookup syntax is entity-set-name(GUID). The two known sets here are
contacts and transactioncurrencies.

In No, leave the branch empty. Existing history is immutable: never use Update a
row/upsert for key recovery. A create collision or timeout can mean the row
already exists. The next scope resolves that outcome, even if Post_Or_Find fails.

## 11. Resolve the durable row and compare every field

Add Scope **Resolve_Posting** immediately after Post_Or_Find. Configure Run after
on Post_Or_Find for **is successful**, **has failed**, **has timed out** ONLY.
Leave **is skipped** unchecked so earlier validation failures cannot enter this
scope. This is essential: a failed create must not skip key recovery.

Inside Resolve_Posting, add List rows **Resolve_Key**, with the same table,
select columns, filter and Row count 2 as Find_Key.

Reject unless exactly one row is returned. If a timed-out create has not become
visible yet, return unconfirmed; the page keeps the key and an identical user
retry re-runs the lookup. Do not generate a new key, blindly re-create, or claim
the original transaction was rolled back. The Active unique key protects against
concurrent misses and a previous delayed create.

Compose **Saved_Row**:

```text
first(body('Resolve_Key')?['value'])
```

Reject unless ALL of these are true:

- Saved key equals Posting_Key.
- _hr_employee_value equals Employee_Id.
- <RECORDED_BY_VALUE> equals Actor_Id (case-normalize GUID strings).
- hr_transactiontype equals Movement_Type as a number.
- The saved amount is positive and its decimal value multiplied by 100 equals
  Amount_Cents exactly. Use decimal(), not rounded float equality.
- hr_notespurpose equals Notes exactly; do not trim old values to hide changes.
- _transactioncurrencyid_value equals PKR_Id.
- _hr_linkedrequest_value is empty.
- <CASH_PK> is a nonempty GUID.

A different actor/employee/amount/type/reason/currency under the same key is a
conflict, not a retry to accept. Never overwrite it. Verify saved create output
through this same read path; do not rely only on Create_Cash's success status.

After replacing the two metadata placeholders, this is the Condition expression:

```text
and(
  equals(toLower(string(outputs('Saved_Row')?['crec6_postingkey'])),outputs('Posting_Key')),
  equals(toLower(string(outputs('Saved_Row')?['_hr_employee_value'])),outputs('Employee_Id')),
  equals(toLower(string(outputs('Saved_Row')?['<RECORDED_BY_VALUE>'])),outputs('Actor_Id')),
  equals(outputs('Saved_Row')?['hr_transactiontype'],outputs('Movement_Type')),
  equals(mul(decimal(string(outputs('Saved_Row')?['hr_amount'])),decimal('100')),decimal(string(outputs('Amount_Cents')))),
  equals(outputs('Saved_Row')?['hr_notespurpose'],outputs('Notes')),
  equals(toLower(string(outputs('Saved_Row')?['_transactioncurrencyid_value'])),outputs('PKR_Id')),
  empty(outputs('Saved_Row')?['_hr_linkedrequest_value']),
  not(empty(outputs('Saved_Row')?['<CASH_PK>']))
)
```

Set **vTransactionId** from Saved_Row's actual <CASH_PK>. Place all remaining
ledger/calculation actions INSIDE Resolve_Posting, following this comparison.
They then run after a recovered create failure, rather than depending on the
failed status of Post_Or_Find or the aggregate Work scope.

## 12. Read the whole employee ledger

Inside Resolve_Posting add Dataverse List rows **List_Ledger**:

| Setting | Value |
| --- | --- |
| Table | Cash Transactions |
| Select columns | <CASH_PK>,_hr_employee_value,hr_amount,hr_transactiontype,_hr_linkedrequest_value,_transactioncurrencyid_value,createdon |
| Filter rows | concat('_hr_employee_value eq ',outputs('Employee_Id')) |
| Sort by | createdon asc,<CASH_PK> asc |
| Row count | Leave empty |
| Pagination (action Settings) | On |
| Threshold | 100000 |

Reject unless `length(body('List_Ledger')?['value'])` is LESS THAN 100000, and
`body('List_Ledger')?['@odata.nextLink']` is empty. Microsoft notes a thresholded
pagination response can omit nextLink even when truncated, so the length guard
is required too. Reject exactly-at-cap as well; do not display a partial balance.
No FetchXML aggregation is used in this recipe: the connector's FetchXML limits
and pagination differ from this OData List rows setup.

Include all ledger types, including approved expenses. Do not filter to the
latest ten or only this Finance operation. No balance may be confirmed unless
the saved vTransactionId is found in the retrieved ledger below.

A very large ledger may also exceed synchronous request/time limits before the
row cap. That remains unconfirmed; do not loosen this into a partial success.
The portal reader also has its existing finite paging guard. At that scale,
implement a trusted aggregation/paging service rather than silently truncating.

## 13. Validate and sum the ledger sequentially

Add **Apply to each**, rename **Each_Ledger_Row**, input:

```text
body('List_Ledger')?['value']
```

Leave its concurrency OFF (one row at a time), because the loop maintains a sum
and a set of seen expense IDs. Do not put Terminate inside Apply to each. Use
vLedgerValid to record validation failures, then reject AFTER the loop. Inside
each iteration add a Condition vLedgerValid equals true; leave No empty and put
the following actions in Yes:

1. Compose **Row_Scaled_Text**:

   ```text
   string(mul(decimal(string(items('Each_Ledger_Row')?['hr_amount'])),decimal('100')))
   ```

2. Compose **Row_Cents**:

   ```text
   int(first(split(outputs('Row_Scaled_Text'),'.')))
   ```

3. Add a Condition requiring Row_Cents > 0 and <= 9007199254740991,
   Row_Scaled_Text equals Row_Cents as decimals, the employee equals Employee_Id,
   the currency equals PKR_Id, and the numeric type is one of 123140000,
   123140001, 123140002. In No, set vLedgerValid = false and do no more work on
   that row. Put steps 4-7 in Yes. Null amounts, unknown types, fractional cents
   and mixed currencies must never be converted to zero. A conversion exception
   fails Work and leaves vConfirmed false.

   ```text
   and(
     greater(outputs('Row_Cents'),0),
     lessOrEquals(outputs('Row_Cents'),9007199254740991),
     equals(decimal(outputs('Row_Scaled_Text')),decimal(string(outputs('Row_Cents')))),
     equals(toLower(string(items('Each_Ledger_Row')?['_hr_employee_value'])),outputs('Employee_Id')),
     equals(toLower(string(items('Each_Ledger_Row')?['_transactioncurrencyid_value'])),outputs('PKR_Id')),
     contains(createArray(123140000,123140001,123140002),items('Each_Ledger_Row')?['hr_transactiontype'])
   )
   ```

4. If type = 123140001, require a Linked Request GUID. Set vLedgerValid = false
   if it is empty or its normalized value is already in vSeenExpenseRequests;
   otherwise Append to array variable vSeenExpenseRequests. Thus duplicate
   expense postings make the ledger invalid rather than being silently counted
   twice. Finance given/returned rows do not require a Linked Request.

5. Only if vLedgerValid is still true, use **Increment variable vBalanceCents**,
   Value:

   ```text
   if(equals(items('Each_Ledger_Row')?['hr_transactiontype'],123140000),
     outputs('Row_Cents'),sub(0,outputs('Row_Cents')))
   ```

6. If vBalanceCents leaves -9007199254740991 through 9007199254740991 (the client
   safe-integer cents range), set vLedgerValid = false.

7. If the row's <CASH_PK> equals vTransactionId, set vPostedRowSeen = true.

After the loop (outside it), reject unless BOTH vLedgerValid and vPostedRowSeen
are true. Compose **Balance_Result**:

```text
div(variables('vBalanceCents'),100.0)
```

The .0 is intentional; integer division would lose cents. Confirm that converting
the result back to decimal cents still equals vBalanceCents:

```text
equals(
  mul(decimal(string(outputs('Balance_Result'))),decimal('100')),
  decimal(string(variables('vBalanceCents')))
)
```

Reject if not. Set **vConfirmed = true** as the VERY LAST action inside
Resolve_Posting, after all saved-row and full-ledger checks. There must be no
later financial/calculation action that can fail after setting this flag.

Do not add an Update Contact Current Balance action. The website already derives
balances from Cash Transactions. A second-step summary write can fail after a
successful create or overwrite a concurrent approval's newer projection. This
recipe leaves hr_currentbalance unchanged. If another application needs that
column current, implement a separate reconciled projection/transactional service
shared with expense approval; that is not implemented by this recipe.

The returned balance reflects the successful ledger read, not a permanent lock
against later/concurrent movements from other writers. Refresh reads it again.

## 14. Return a typed result in Finalize

In Finalize add Condition: vConfirmed equals true.

YES: **Power Pages > Return value(s) to Power Pages**, with these outputs:

| Output name | Type | Value |
| --- | --- | --- |
| status | Text | posted |
| postingKey | Text | vPostingKey |
| employeeId | Text | vEmployeeId |
| transactionId | Text | vTransactionId |
| balance | Number | Balance_Result output |

Expected HTTP 200 JSON body:

```json
{"status":"posted","postingKey":"<same UUID>","employeeId":"<same Contact GUID>","transactionId":"<saved Cash Transaction GUID>","balance":1000.25}
```

Do not put that object inside a Text result field and do not return balance as
a quoted string. Inspect actual returned property names/casing in a test: the
current frontend checks these camelCase names. If the designer normalizes them
or wraps results, reconcile that with the helper before enabling real posting;
labels alone are not verified response keys. No success is accepted by the page
unless HTTP status, IDs, key, numeric balance and posted status all match.

NO: Return value(s) to Power Pages, Text outputs:

| Output name | Value |
| --- | --- |
| status | unconfirmed |
| postingKey | vPostingKey |
| message | Posting could not be confirmed. Keep the page open and check this posting key before retrying. |

The existing page intentionally treats any response other than confirmed posted
as a failure/unconfirmed operation and retains the key. Its general error may
not display a custom message from an HTTP 200 non-posted body. Do not change a
failed response to posted just to make that message disappear.

If a row was saved and calculation/response later failed, that row remains saved.
A same-key retry must resolve it rather than insert another. This flow is not a
transactional rollback of all steps. An HTTP 202 or missing response does not
prove failure or success; keep the same key and inspect/retry safely.

## 15. Attach the flow to the site

Save the flow. In Power Pages Studio > Set up > Cloud flows > Add cloud flow,
select it and associate ONLY **Petty Cash Finance**. Do not select Anonymous
Users, Authenticated Users, Admin-only or the old Accounts role.

Copy the site-generated /_api/cloudflow/v1.0/trigger/<GUID> address. The config
uses the GUID in that SITE route, not a guessed Power Automate designer ID and
not a signed HTTP trigger URL. Keep financeSecurityReviewed false while building.
The native route handles the signed-in session and CSRF; the role marker in HTML
does not grant permission. Connection privileges do not replace site authorization.

## 16. Test before normal Finance posting

Use a test environment and synthetic/test Contacts, not unexplained production
cash movements. A passing mock test in this repository is not a deployed-flow
test. Run the following checks on the actual configured flow:

| Test | Expected result |
| --- | --- |
| Employee/Admin-only/old Accounts/signed-out call | Denied by the site before the flow writes |
| Finance call | Trusted User ID matches that Finance Contact |
| Zero ledger, give 1000 | One positive 123140000 row; balance 1000 |
| Return 250 using a new key | One 123140002 row; balance 750 |
| New key, amount 0.01 | Exactly one cent change |
| Negative starting balance -500, give 200 | Balance -300; allowed |
| Same key and identical actor/input, repeated/concurrent | Same transaction ID; one row total; current validated ledger balance |
| Same key, different amount/employee/type/notes/actor | Rejected; old row unchanged |
| Malformed GUID or OData quote injection | Rejected before a key filter/create |
| Zero/negative/1.001 amount, bad type, empty/overlong notes | Rejected; no create |
| Inactive/missing employee or actor | Rejected; no create |
| Missing/duplicate PKR or wrong ledger currency | No confirmed balance; resolve currency setup |
| Unknown type, null/invalid amount or duplicate linked expense | No confirmed balance; repair ledger through an audited process |
| Create commits, then response is lost | Same-key retry recovers row; no duplicate |
| Create fails for real; no row exists | Unconfirmed; never report posted |
| Post_Or_Find fails, recovery succeeds | Resolve_Posting still runs; Finalize uses vConfirmed rather than aggregate Work status |
| Ledger excludes the newly saved row or hits paging cap | Unconfirmed; no partial sum |
| Successful response | Exact expected keys, Number balance, HTTP 200 |
| Contact summary | Not changed by this flow; portal still shows ledger total |

To verify end-to-end before allowing normal users, use an isolated test site/copy
of the Finance page with its test flow GUID/config, or another authenticated test
harness calling the native site route with native CSRF. Do not expose tokens,
signed endpoints or whole run histories when sharing results. Do not enable the
production Finance page simply to bypass incomplete backend checks. The current
portal has no special test mode; isolate test enablement explicitly.

Once the backend and authorization tests pass, set the existing Finance page's
config to the verified site route GUID and financeSecurityReviewed: true. Save,
sync and reload the Finance page. No shared helper or employee/receipt/Admin page
replacement is needed if the trigger/response contract matches the current helper.

## Build status and exact remaining metadata

This document defines all actions and branches but does not create/import them.
Before calling the recipe tenant-ready, confirm <CASH_PK>, the new/existing
Recorded By lookup names, hr_amount precision/range, PKR row, trusted User ID,
actual trigger inputs/return keys and connection/site authorization. These facts
cannot be safely inferred from the frontend or the older Word schema. Copy the
names from the tenant and keep them in this guide as the build is verified.

## Microsoft references

- [Power Pages flow integration and request parameters](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
- [Power Pages flow inputs and Return value(s) example](https://learn.microsoft.com/en-us/power-pages/configure/power-automate-how-to)
- [Built-in trigger User ID example](https://learn.microsoft.com/en-us/power-pages/configure/image-library-how-to)
- [Classic/new designer limitations](https://learn.microsoft.com/en-us/power-automate/flows-designer#limitations-and-known-issues-in-the-new-designer)
- [Dataverse create and lookup syntax](https://learn.microsoft.com/en-us/power-automate/dataverse/create)
- [List rows pagination limits](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)
- [Decimal and other workflow expressions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- [Scopes and error handling](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/error-handling)
- [Trigger concurrency considerations](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers)
- [Alternate-key activation](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-alternate-keys-portal)
