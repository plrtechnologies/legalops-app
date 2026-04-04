import {
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  opinionRequestsApi,
  bankClientsApi,
  endCustomersApi,
  opinionTemplatesApi,
} from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  DOCUMENTS_PENDING: 'gold',
  UNDER_REVIEW: 'blue',
  OPINION_DRAFTED: 'cyan',
  FINAL: 'green',
  REJECTED: 'red',
};

type OpinionRequestRow = {
  id: string;
  referenceNumber: string;
  bankClient?: { name?: string };
  endCustomer?: { name?: string };
  loanType: string;
  status: string;
  dueDate?: string;
};

export default function OpinionRequestsListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const bankClientIdWatch = Form.useWatch('bankClientId', form);

  const { data, isLoading } = useQuery({
    queryKey: ['opinion-requests'],
    queryFn: () => opinionRequestsApi.list().then((r) => r.data),
  });

  const { data: banks = [] } = useQuery({
    queryKey: ['bank-clients'],
    queryFn: () => bankClientsApi.list().then((r) => r.data),
  });

  const { data: endCustomers = [] } = useQuery({
    queryKey: ['end-customers', bankClientIdWatch],
    queryFn: () => endCustomersApi.list(bankClientIdWatch).then((r) => r.data),
    enabled: !!bankClientIdWatch,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['opinion-templates', bankClientIdWatch],
    queryFn: () => opinionTemplatesApi.list(bankClientIdWatch).then((r) => r.data),
    enabled: !!bankClientIdWatch,
  });

  useEffect(() => {
    if (!createOpen) return;
    form.setFieldsValue({ endCustomerId: undefined, templateId: undefined });
  }, [bankClientIdWatch, createOpen, form]);

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      opinionRequestsApi.create({
        ...values,
        loanAmount: values.loanAmount != null ? String(values.loanAmount) : undefined,
        dueDate: values.dueDate ? dayjs(values.dueDate as string).format('YYYY-MM-DD') : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opinion-requests'] });
      setCreateOpen(false);
      form.resetFields();
      message.success('Opinion request created');
    },
    onError: () => message.error('Could not create request'),
  });

  const columns: ColumnsType<OpinionRequestRow> = [
    { title: 'Reference', dataIndex: 'referenceNumber', key: 'ref' },
    {
      title: 'Bank client',
      key: 'bank',
      render: (_, row) => row.bankClient?.name ?? '—',
    },
    {
      title: 'Borrower',
      key: 'borrower',
      render: (_, row) => row.endCustomer?.name ?? '—',
    },
    { title: 'Loan type', dataIndex: 'loanType', key: 'loan' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Due',
      dataIndex: 'dueDate',
      key: 'due',
      render: (d: string | undefined) => (d ? dayjs(d).format('DD MMM YYYY') : '—'),
    },
    {
      title: '',
      key: 'action',
      render: (_, row) => (
        <Button icon={<FolderOpenOutlined />} size="small" onClick={() => navigate(`/opinion-requests/${row.id}`)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Opinion requests
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New request
        </Button>
      </Space>

      <Table<OpinionRequestRow>
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
      />

      <Modal
        title="New opinion request"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="referenceNumber" label="Reference number" rules={[{ required: true }]}>
            <Input placeholder="e.g. OP-2026-0001" />
          </Form.Item>
          <Form.Item name="bankClientId" label="Bank client" rules={[{ required: true }]}>
            <Select
              placeholder="Select bank"
              options={banks.map((b: { id: string; name: string; code: string }) => ({
                value: b.id,
                label: `${b.name} (${b.code})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="endCustomerId" label="End customer (borrower)" rules={[{ required: true }]}>
            <Select
              placeholder={bankClientIdWatch ? 'Select borrower' : 'Select bank first'}
              disabled={!bankClientIdWatch}
              options={endCustomers.map((e: { id: string; name: string }) => ({
                value: e.id,
                label: e.name,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="loanType" label="Loan type" rules={[{ required: true }]}>
            <Input placeholder="e.g. HOME_LOAN" />
          </Form.Item>
          <Form.Item name="loanAmount" label="Loan amount">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="propertyLocation" label="Property location">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="branchCode" label="Branch code">
            <Input />
          </Form.Item>
          <Form.Item name="templateId" label="Opinion template (optional)">
            <Select
              allowClear
              placeholder="Default from bank client"
              disabled={!bankClientIdWatch}
              options={templates.map((t: { id: string; name: string }) => ({
                value: t.id,
                label: t.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="NORMAL">
            <Select
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH', label: 'High' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dueDate" label="Due date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
