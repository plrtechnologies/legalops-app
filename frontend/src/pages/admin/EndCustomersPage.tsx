import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { endCustomersApi } from '../../services/api';

const { Title } = Typography;

export default function EndCustomersPage() {
  const { bankClientId } = useParams<{ bankClientId: string }>();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['end-customers', bankClientId],
    queryFn: () => endCustomersApi.list(bankClientId).then((r) => r.data),
    enabled: !!bankClientId,
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => endCustomersApi.create({ ...values, bankClientId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['end-customers', bankClientId] }); setModalOpen(false); form.resetFields(); message.success('Customer created'); },
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'PAN', dataIndex: 'panNumber', key: 'panNumber' },
  ];

  return (
    <>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>End Customers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Customer</Button>
      </Space>
      <Table loading={isLoading} dataSource={data ?? []} columns={columns} rowKey="id" />

      <Modal title="Add End Customer" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={createMutation.isPending}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="panNumber" label="PAN Number"><Input /></Form.Item>
          <Form.Item name="aadhaarNumber" label="Aadhaar Number"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
