/** Keycloak realm roles allowed to open tenant branding / org settings in the UI and API. */
export const TENANT_BRANDING_ROLES = ['super_admin', 'firm_admin', 'tenant_branding_manager'] as const;

/** Matches backend `GET /reports/audit-logs` RBAC. */
export const AUDIT_REPORT_ROLES = ['super_admin', 'firm_admin', 'senior_advocate', 'panel_advocate', 'paralegal'] as const;

export function canManageTenantBranding(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return TENANT_BRANDING_ROLES.some((r) => roles.includes(r));
}

export function canViewAuditReports(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return AUDIT_REPORT_ROLES.some((r) => roles.includes(r));
}

export const USER_MANAGEMENT_ROLES = ['super_admin', 'firm_admin'] as const;

export function canManageUsers(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return USER_MANAGEMENT_ROLES.some((r) => roles.includes(r));
}
