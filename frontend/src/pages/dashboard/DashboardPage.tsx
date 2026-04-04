import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Spin, Typography, Tag } from 'antd';
import {
  FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined,
  UserOutlined, FileSearchOutlined, WarningOutlined,
} from '@ant-design/icons';
import { dashboardApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const { Title } = Typography;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
  });

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  if (!stats) return null;

  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.totalRequests}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Assignments"
              value={stats.pendingAssignments}
              prefix={<WarningOutlined />}
              valueStyle={stats.pendingAssignments > 0 ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Opinions This Month"
              value={stats.opinionsThisMonth}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Issued This Month"
              value={stats.issuedThisMonth}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Documents Processed"
              value={stats.documentsProcessed}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg TAT (Days)"
              value={stats.averageTatDays ?? 'N/A'}
              prefix={<ClockCircleOutlined />}
              precision={stats.averageTatDays ? 1 : undefined}
            />
          </Card>
        </Col>
        {['panel_advocate', 'senior_advocate'].includes(user?.role ?? '') && (
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="My Pending Work"
                value={stats.myPendingWork}
                prefix={<UserOutlined />}
                valueStyle={stats.myPendingWork > 0 ? { color: '#1677ff' } : undefined}
              />
            </Card>
          </Col>
        )}
      </Row>

      {stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
        <Card title="Request Status Breakdown" style={{ marginTop: 16 }}>
          <Row gutter={[16, 8]}>
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <Col key={status}>
                <Tag>{status.replace(/_/g, ' ')}</Tag>
                <strong>{count as number}</strong>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </>
  );
}
