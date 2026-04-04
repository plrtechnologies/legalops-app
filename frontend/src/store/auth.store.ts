import { create } from 'zustand';
import keycloak from '../auth/keycloak';
import { useTenantBrandingStore } from './tenant-branding.store';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];
  tenantId: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: () => string | undefined;
  login: () => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setLoading: (v: boolean) => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: () => keycloak.token,
  login: () => keycloak.login(),
  logout: () => {
    useTenantBrandingStore.getState().clearBranding();
    keycloak.logout({ redirectUri: window.location.origin });
  },
  setUser: (user) => set({ user, isAuthenticated: true }),
  setLoading: (isLoading) => set({ isLoading }),
  hasRole: (role: string) => !!get().user?.roles?.includes(role),
}));
