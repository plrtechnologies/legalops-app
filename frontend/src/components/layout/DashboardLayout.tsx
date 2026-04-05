import { useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Space, Typography, theme, Image } from 'antd';
import {
  DashboardOutlined,
  FolderOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  BankOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../../store/auth.store';
import { useTenantBrandingStore } from '../../store/tenant-branding.store';
import { canManageTenantBranding, canViewAuditReports } from '../../lib/tenant-roles';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();
  const { user, logout } = useAuthStore();
  const branding = useTenantBrandingStore((s) => s.branding);

  const isFirmAdmin = user?.roles?.includes('firm_admin') || user?.roles?.includes('super_admin');

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/opinion-requests', icon: <FolderOutlined />, label: 'Opinion Requests' },
    ];
    if (isFirmAdmin) {
      items.push({
        key: '/admin/bank-clients',
        icon: <BankOutlined />,
        label: 'Bank Clients',
      });
      items.push({
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: 'Users',
      });
    }
    if (canViewAuditReports(user?.roles)) {
      items.push({
        key: '/reports/audit-logs',
        icon: <FileSearchOutlined />,
        label: 'Audit Log',
      });
    }
    if (user?.roles?.includes('super_admin') || user?.roles?.includes('firm_admin') || user?.roles?.includes('senior_advocate')) {
      items.push({
        key: '/reports/analytics',
        icon: <BarChartOutlined />,
        label: 'Reports',
      });
    }
    if (canManageTenantBranding(user?.roles)) {
      items.push({
        key: '/admin/tenant',
        icon: <SettingOutlined />,
        label: 'Tenant Settings',
      });
    }
    return items;
  }, [user?.roles, isFirmAdmin]);

  const selectedKey =
    menuItems
      ?.map((i) => (i && 'key' in i ? String(i.key) : ''))
      .filter(Boolean)
      .find((key) => location.pathname === key || location.pathname.startsWith(`${key}/`)) ??
    '/dashboard';

  const firmLabel = branding?.name ?? 'LegalOps';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          background: themeToken.colorBgContainer,
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
          <Space align="center" size={12} style={{ width: '100%' }}>
            {branding?.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt=""
                preview={false}
                style={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain' }}
              />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 18, display: 'block' }}>
                {firmLabel}
              </Text>
              {branding?.code ? (
                <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                  {branding.code}
                </Text>
              ) : null}
            </div>
          </Space>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: themeToken.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Space>
            <Avatar icon={<UserOutlined />} />
            <Text>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({user?.role})
            </Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            background: themeToken.colorBgContainer,
            borderRadius: themeToken.borderRadius,
            padding: 24,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
