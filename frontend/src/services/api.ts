import axios from 'axios';
import keycloak from '../auth/keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
});

api.interceptors.request.use((config) => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await keycloak.updateToken(30);
        return api.request(originalRequest);
      } catch {
        keycloak.logout();
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const bankClientsApi = {
  list: () => api.get('/api/v1/bank-clients'),
  get: (id: string) => api.get(`/api/v1/bank-clients/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/v1/bank-clients', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/bank-clients/${id}`, data),
  remove: (id: string) => api.delete(`/api/v1/bank-clients/${id}`),
};

export const endCustomersApi = {
  list: (bankClientId?: string) =>
    api.get('/api/v1/end-customers', { params: bankClientId ? { bankClientId } : {} }),
  get: (id: string) => api.get(`/api/v1/end-customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/v1/end-customers', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/end-customers/${id}`, data),
  remove: (id: string) => api.delete(`/api/v1/end-customers/${id}`),
};

export const opinionTemplatesApi = {
  list: (bankClientId: string) =>
    api.get('/api/v1/opinion-templates', { params: { bankClientId } }),
  get: (id: string) => api.get(`/api/v1/opinion-templates/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/v1/opinion-templates', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/opinion-templates/${id}`, data),
  remove: (id: string) => api.delete(`/api/v1/opinion-templates/${id}`),
};

export const opinionRequestsApi = {
  list: () => api.get('/api/v1/opinion-requests'),
  get: (id: string) => api.get(`/api/v1/opinion-requests/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/v1/opinion-requests', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/v1/opinion-requests/${id}/status`, { status }),
  assign: (id: string, lawyerId: string) =>
    api.patch(`/api/v1/opinion-requests/${id}/assign`, { lawyerId }),
  remove: (id: string) => api.delete(`/api/v1/opinion-requests/${id}`),
};

export const documentsApi = {
  list: (opinionRequestId: string) =>
    api.get(`/api/v1/opinion-requests/${opinionRequestId}/documents`),
  upload: (opinionRequestId: string, formData: FormData) =>
    api.post(`/api/v1/opinion-requests/${opinionRequestId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSignedUrl: (opinionRequestId: string, docId: string) =>
    api.get(`/api/v1/opinion-requests/${opinionRequestId}/documents/${docId}/signed-url`),
  remove: (opinionRequestId: string, docId: string) =>
    api.delete(`/api/v1/opinion-requests/${opinionRequestId}/documents/${docId}`),
};

export const opinionsApi = {
  list: (opinionRequestId: string) =>
    api.get(`/api/v1/opinion-requests/${opinionRequestId}/opinions`),
  get: (opinionRequestId: string, id: string) =>
    api.get(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}`),
  create: (opinionRequestId: string, data: Record<string, unknown>) =>
    api.post(`/api/v1/opinion-requests/${opinionRequestId}/opinions`, data),
  update: (opinionRequestId: string, id: string, data: Record<string, unknown>) =>
    api.patch(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}`, data),
  submit: (opinionRequestId: string, id: string) =>
    api.patch(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}/submit`),
  approve: (opinionRequestId: string, id: string) =>
    api.patch(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}/approve`),
  issue: (opinionRequestId: string, id: string) =>
    api.patch(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}/issue`),
  addComment: (opinionRequestId: string, id: string, comment: string) =>
    api.post(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}/comments`, { comment }),
  generateDraft: (opinionRequestId: string, id: string) =>
    api.post(`/api/v1/opinion-requests/${opinionRequestId}/opinions/${id}/generate-draft`),
};

export const tenantApi = {
  getBranding: () => api.get('/api/v1/tenant/branding'),
  getSettings: () => api.get('/api/v1/tenant/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/api/v1/tenant/settings', data),
  updateBranding: (formData: FormData) =>
    api.put('/api/v1/tenant/branding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

/** No bearer token required — for branded sign-in and embeds. */
export const publicTenantsApi = {
  getConfig: (params: { code?: string; slug?: string }) =>
    api.get<PublicTenantConfig>('/api/v1/public/tenants/config', { params }),
};

export interface PublicTenantConfig {
  code: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export interface AuditLogRow {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  userId: string;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogsListResponse {
  items: AuditLogRow[];
  total: number;
}

export const reportsApi = {
  auditLogs: (params: {
    from?: string;
    to?: string;
    entityType?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) => api.get<AuditLogsListResponse>('/api/v1/reports/audit-logs', { params }),
  tat: (params?: { from?: string; to?: string; bankClientId?: string }) =>
    api.get('/api/v1/reports/tat', { params }),
  workload: () => api.get('/api/v1/reports/workload'),
  compliance: (params?: { from?: string; to?: string }) =>
    api.get('/api/v1/reports/compliance', { params }),
};

export const dashboardApi = {
  getStats: () => api.get('/api/v1/dashboard/stats'),
};

export const usersApi = {
  list: () => api.get('/api/v1/users'),
  get: (id: string) => api.get(`/api/v1/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/v1/users', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/api/v1/users/${id}`, data),
  deactivate: (id: string) => api.patch(`/api/v1/users/${id}/deactivate`),
};
