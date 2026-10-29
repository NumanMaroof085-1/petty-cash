/* Finance page configuration, mirrored in pettycash-module-config.example.js.
 * Never paste a public/signed HTTP flow URL. Enable only after Finance-only
 * page/flow permissions, server validation and duplicate-post tests pass.
 */
window.PC_MODULE_CONFIG = {
  financeFlowId: "",
  financeSecurityReviewed: false,
  requestStatus: { Pending: 123140000, Approved: 123140001, Rejected: 123140002 }
};
