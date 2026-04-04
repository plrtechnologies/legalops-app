import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, Table, Statistic, Row, Col, DatePicker, Spin, Typography } from 'antd';
import { reportsApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

function TatTab() {
  const [range, setRange] = useState<[string?, string?]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['reports-tat', range],
    queryFn: () => reportsApi.tat({ from: range[0], to: range[1] }).then((r) => r.data),
  });

  return (
    <>
      <RangePicker
        style={{ marginBottom: 16 }}
        onChange={(_, ds) => setRange([ds[0] || undefined, ds[1] || undefined])}
      />
      <Table
        loading={isLoading}
        dataSource={data ?? []}
        rowKey="bankClientId"
        columns={[
          { title: 'Bank Client ID', dataIndex: 'bankClientId', key: 'bankClientId' },
          { title: 'Issued Count', dataIndex: 'count', key: 'count' },
          { title: 'Avg Days', dataIndex: 'avgDays', key: 'avgDays' },
          { title: 'Min Days', dataIndex: 'minDays', key: 'minDays' },
          { title: 'Max Days', dataIndex: 'maxDays', key: 'maxDays' },
        ]}
        pagination={false}
      />
    </>
  );
}

function WorkloadTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-workload'],
    queryFn: () => reportsApi.workload().then((r) => r.data),
  });

  return (
    <Table
      loading={isLoading}
      dataSource={data ?? []}
      rowKey="lawyerId"
      columns={[
        { title: 'Lawyer', dataIndex: 'lawyerName', key: 'lawyerName' },
        { title: 'Total', dataIndex: 'total', key: 'total' },
        {
          title: 'Status Breakdown', dataIndex: 'statuses', key: 'statuses',
          render: (statuses: Record<string, number>) =>
            Object.entries(statuses ?? {}).map(([s, c]) => `${s.replace(/_/g, ' ')}: ${c}`).join(', '),
        },
      ]}
      pagination={false}
    />
  );
}

function ComplianceTab() {
  const [range, setRange] = useState<[string?, string?]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['reports-compliance', range],
    queryFn: () => reportsApi.compliance({ from: range[0], to: range[1] }).then((r) => r.data),
  });

  if (isLoading) return <Spin />;

  return (
    <>
      <RangePicker
        style={{ marginBottom: 16 }}
        onChange={(_, ds) => setRange([ds[0] || undefined, ds[1] || undefined])}
      />
      {data && (
        <Row gutter={16}>
          <Col span={6}><Card><Statistic title="Total Issued" value={data.totalIssued} /></Card></Col>
          <Col span={6}><Card><Statistic title="On Time" value={data.onTime} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="SLA Breached" value={data.breached} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="On-Time %" value={data.onTimePercentage ?? 'N/A'} suffix="%" /></Card></Col>
        </Row>
      )}
    </>
  );
}

export default function ReportsPage() {
  return (
    <>
      <Title level={3} style={{ marginBottom: 24 }}>Reports & Analytics</Title>
      <Tabs
        defaultActiveKey="tat"
        items={[
          { key: 'tat', label: 'Turnaround Time', children: <TatTab /> },
          { key: 'workload', label: 'Workload', children: <WorkloadTab /> },
          { key: 'compliance', label: 'Compliance', children: <ComplianceTab /> },
        ]}
      />
    </>
  );
}
