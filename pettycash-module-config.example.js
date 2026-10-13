/* Copy into the Accounts page template BEFORE loading pettycash-modules.js.
 * These values are intentionally unset. Never use a public HTTP flow URL.
 * The flow must be attached to the site with ONLY Petty Cash Accounts role.
 */
window.PC_MODULE_CONFIG = {
  accountsFlowId: "", // GUID from the Power Pages Cloud flows integration.
  accountsSecurityReviewed: false, // Enable only after server validation/uniqueness tests.
  requestStatus: { Pending: 123140000, Approved: 123140001, Rejected: 123140002 }
};
