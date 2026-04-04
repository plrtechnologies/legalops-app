import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Switch, Space, Typography, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bankClientsApi } from '../../services/api';

const { Title } = Typography;

export default function BankClientsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['bank-clients'],
    queryFn: () => bankClientsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => bankClientsApi.create(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-clients'] }); setModalOpen(false); form.resetFields(); message.success('Bank client created'); },
  });

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Branch', dataIndex: 'branch', key: 'branch' },
    { title: 'Contact', dataIndex: 'contactEmail', key: 'contactEmail' },
    {
      title: 'Notify Bank', dataIndex: 'notifyBankOnCompletion', key: 'notifyBank',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/admin/bank-clients/${r.id}/end-customers`)}>Customers</Button>
          <Button size="small" onClick={() => navigate(`/admin/bank-clients/${r.id}/templates`)}>Templates</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Bank Clients</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Bank Client</Button>
      </Space>
      <Table loading={isLoading} dataSource={data ?? []} columns={columns} rowKey="id" />

      <Modal title="Add Bank Client" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="branch" label="Branch"><Input /></Form.Item>
          <Form.Item name="contactName" label="Contact Name"><Input /></Form.Item>
          <Form.Item name="contactEmail" label="Contact Email"><Input /></Form.Item>
          <Form.Item name="contactPhone" label="Contact Phone"><Input /></Form.Item>
          <Form.Item name="notifyBankOnCompletion" label="Notify Bank on Completion" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="notifyEndCustomerOnCompletion" label="Notify End Customer on Completion" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
