import { useMemo, useState } from 'react';
import {
  Table,
  Typography,
  Space,
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { reportsApi, type AuditLogRow } from '../../services/api';

const { Title, Text } = Typography;

const ENTITY_TYPES = [
  { value: 'opinion_request', label: 'Opinion request' },
  { value: 'document', label: 'Document' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'tenant', label: 'Tenant' },
];

function jsonPreview(v: Record<string, unknown> | null | undefined): string {
  if (v == null || Object.keys(v).length === 0) return '—';
  try {
    return JSON.stringify(v);
  } catch {
    return '—';
  }
}

export default function AuditLogsReportPage() {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [query, setQuery] = useState<{
    from?: string;
    to?: string;
    entityType?: string;
    userId?: string;
  }>({});

  const offset = (page - 1) * pageSize;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reports', 'audit-logs', query, page, pageSize],
    queryFn: () =>
      reportsApi
        .auditLogs({
          ...query,
          limit: pageSize,
          offset,
        })
        .then((r) => r.data),
  });

  const onSearch = (values: {
    range?: [Dayjs, Dayjs];
    entityType?: string;
    userId?: string;
  }) => {
    const range = values.range;
    setPage(1);
    setQuery({
      from: range?.[0]?.startOf('day').toISOString(),
      to: range?.[1]?.endOf('day').toISOString(),
      entityType: values.entityType || undefined,
      userId: values.userId?.trim() || undefined,
    });
  };

  const columns: ColumnsType<AuditLogRow> = useMemo(
    () => [
      {
        title: 'When',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (d: string) => dayjs(d).format('DD MMM YYYY HH:mm:ss'),
      },
      {
        title: 'Entity',
        key: 'entity',
        width: 200,
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Tag>{row.entityType}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }} copyable={{ text: row.entityId }}>
              {row.entityId.slice(0, 8)}…
            </Text>
          </Space>
        ),
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: 160,
        render: (a: string) => <Tag color="blue">{a.replace(/_/g, ' ')}</Tag>,
      },
      {
        title: 'User',
        key: 'user',
        width: 220,
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            {row.userEmail ? <Text style={{ fontSize: 13 }}>{row.userEmail}</Text> : null}
            <Text type="secondary" style={{ fontSize: 12 }} copyable={{ text: row.userId }}>
              {row.userId}
            </Text>
          </Space>
        ),
      },
      { title: 'IP', dataIndex: 'ipAddress', key: 'ip', width: 130, render: (ip: string | null) => ip ?? '—' },
      {
        title: 'Details',
        key: 'details',
        ellipsis: true,
        render: (_, row) => {
          const oldV = jsonPreview(row.oldValues);
          const newV = jsonPreview(row.newValues);
          const text = [oldV !== '—' ? `old: ${oldV}` : '', newV !== '—' ? `new: ${newV}` : '']
            .filter(Boolean)
            .join(' | ');
          return (
            <Tooltip title={<pre style={{ maxWidth: 480, whiteSpace: 'pre-wrap' }}>{text}</pre>}>
              <Text ellipsis style={{ maxWidth: 320, display: 'block' }}>
                {text || '—'}
              </Text>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <Title level={4} style={{ marginTop: 0 }}>
        Audit log
      </Title>
      <Text type="secondary">Compliance trail for your firm (filtered by your tenant).</Text>

      <Form
        form={form}
        layout="inline"
        onFinish={onSearch}
        style={{ marginTop: 20, marginBottom: 16, rowGap: 12, flexWrap: 'wrap' }}
      >
        <Form.Item name="range" label="Date range">
          <DatePicker.RangePicker allowEmpty={[true, true]} />
        </Form.Item>
        <Form.Item name="entityType" label="Entity type">
          <Select
            allowClear
            placeholder="Any"
            style={{ width: 180 }}
            options={ENTITY_TYPES}
          />
        </Form.Item>
        <Form.Item name="userId" label="User ID">
          <Input placeholder="UUID" style={{ width: 280 }} allowClear />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={isFetching}>
            Apply filters
          </Button>
        </Form.Item>
      </Form>

      <Table<AuditLogRow>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </>
  );
}
