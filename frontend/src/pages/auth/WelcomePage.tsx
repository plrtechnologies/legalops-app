import { useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Spin, ConfigProvider, theme, Image } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { publicTenantsApi } from '../../services/api';
import keycloak from '../../auth/keycloak';

const { Title, Text, Paragraph } = Typography;

function isHexColor(s: string | null | undefined): s is string {
  return !!s && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(s.trim());
}

type LocationState = { from?: { pathname: string; search?: string } };

function postLoginPath(state: LocationState | undefined): string {
  const from = state?.from;
  if (from?.pathname && from.pathname !== '/welcome') {
    return `${from.pathname}${from.search ?? ''}`;
  }
  return '/';
}

export default function WelcomePage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const code = params.get('code')?.trim() || undefined;
  const slug = params.get('slug')?.trim() || undefined;
  const defaultCode = import.meta.env.VITE_DEFAULT_TENANT_CODE?.trim();

  const effectiveCode = code ?? (!slug && defaultCode ? defaultCode : undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-tenant-config', effectiveCode, slug],
    queryFn: () =>
      publicTenantsApi.getConfig({ code: effectiveCode, slug }).then((r) => r.data),
    enabled: !!(effectiveCode || slug),
    retry: false,
  });

  const primary = useMemo(() => {
    const raw = data?.primaryColor?.trim();
    return isHexColor(raw) ? raw : '#1677ff';
  }, [data?.primaryColor]);

  useEffect(() => {
    if (data?.name) document.title = `${data.name} · Sign in`;
    return () => {
      document.title = 'LegalOps';
    };
  }, [data?.name]);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(postLoginPath(location.state as LocationState | undefined), { replace: true });
  }, [isAuthenticated, location.state, navigate]);

  const signIn = () => {
    const path = postLoginPath(location.state as LocationState | undefined);
    void keycloak.login({ redirectUri: `${window.location.origin}${path}` });
  };

  const card = (
    <Card style={{ width: 420, maxWidth: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
      {isLoading && (effectiveCode || slug) ? (
        <div style={{ padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          {data?.logoUrl ? (
            <Image
              src={data.logoUrl}
              alt=""
              preview={false}
              style={{ maxHeight: 56, maxWidth: 200, objectFit: 'contain', marginBottom: 12 }}
            />
          ) : null}
          <Title level={3} style={{ marginBottom: 4 }}>
            {data?.name ?? 'LegalOps'}
          </Title>
          <Text type="secondary">Authentication is managed by Keycloak</Text>
          {!(effectiveCode || slug) ? (
            <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0, fontSize: 13 }}>
              Add <code>?code=</code> or <code>?slug=</code> to this URL, or set{' '}
              <code>VITE_DEFAULT_TENANT_CODE</code> for default branding.
            </Paragraph>
          ) : null}
          {isError ? (
            <Paragraph type="danger" style={{ marginTop: 16 }}>
              Could not load firm branding. You can still sign in.
            </Paragraph>
          ) : null}
          <div style={{ marginTop: 24 }}>
            <Button type="primary" size="large" onClick={signIn}>
              Sign in with Keycloak
            </Button>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: primary } }}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
          padding: 16,
        }}
      >
        {card}
      </div>
    </ConfigProvider>
  );
}
