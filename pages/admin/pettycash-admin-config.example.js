/* Canonical configuration, mirrored inside Admin Users.html before its Admin include.
 * Profile creation enabled for the user-confirmed admin-only page/table setup.
 * No credential flags or password submission. Defaults in the script remain fail-closed.
 * Contact navigation names confirmed by live lookup annotations, 2026-10-15.
 */
window.PC_ADMIN_CONFIG = {
  creationEnabled: true,
  securityReviewed: true,
  departmentIdColumn: "hr_departmentsid",
  contactDepartmentNavigation: "hr_Department",
  contactManagerNavigation: "hr_ReportsToManager",
  roleValues: {
    Employee: 123140000,
    Manager: 123140001,
    Accounts: 123140002,
    Admin: 123140003
  }
};
