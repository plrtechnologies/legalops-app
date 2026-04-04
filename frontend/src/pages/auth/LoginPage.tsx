import { Button, Card, Typography } from 'antd';
import { useAuthStore } from '../../store/auth.store';

const { Title, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <Title level={3} style={{ marginBottom: 4 }}>LegalOps</Title>
        <Text type="secondary">Authentication is managed by Keycloak</Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" size="large" onClick={login}>Sign in with Keycloak</Button>
        </div>
      </Card>
    </div>
  );
}
