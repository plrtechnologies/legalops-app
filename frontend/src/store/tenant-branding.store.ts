import { create } from 'zustand';
import api from '../services/api';

export interface TenantBranding {
  tenantId: string;
  name: string;
  code: string;
  slug: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  subscriptionTier: string;
  maxUsers: number;
  settings: Record<string, unknown> | null;
}

interface TenantBrandingState {
  branding: TenantBranding | null;
  loadBranding: () => Promise<void>;
  clearBranding: () => void;
}

export const useTenantBrandingStore = create<TenantBrandingState>()((set) => ({
  branding: null,
  loadBranding: async () => {
    try {
      const { data } = await api.get<TenantBranding>('/api/v1/tenant/branding');
      set({ branding: data });
    } catch {
      set({ branding: null });
    }
  },
  clearBranding: () => set({ branding: null }),
}));
