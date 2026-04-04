import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import keycloak from './auth/keycloak';
import { useAuthStore } from './store/auth.store';
import 'antd/dist/reset.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

async function bootstrap() {
  const { setUser, setLoading } = useAuthStore.getState();

  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
    });

    if (authenticated && keycloak.tokenParsed) {
      const t = keycloak.tokenParsed as Record<string, any>;
      const roles = (t['realm_access']?.roles ?? []) as string[];
      const rolePriority = [
        'super_admin',
        'firm_admin',
        'senior_advocate',
        'panel_advocate',
        'tenant_branding_manager',
        'paralegal',
      ];
      const primaryRole = rolePriority.find((r) => roles.includes(r)) ?? roles[0] ?? 'paralegal';
      setUser({
        id: t['sub'],
        email: t['email'] ?? t['preferred_username'],
        firstName: t['given_name'] ?? t['preferred_username'] ?? 'User',
        lastName: t['family_name'] ?? '',
        role: primaryRole,
        roles,
        tenantId: t['tenant_id'] ?? '',
      });

      setInterval(() => {
        keycloak.updateToken(60).catch(() => keycloak.logout());
      }, 30_000);
    }
  } catch (err) {
    console.error('Keycloak init failed', err);
  } finally {
    setLoading(false);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap();
