import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, message, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usersApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const ROLES = [
  { value: 'firm_admin', label: 'Firm Admin' },
  { value: 'senior_advocate', label: 'Senior Advocate' },
  { value: 'panel_advocate', label: 'Panel Advocate' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'tenant_branding_manager', label: 'Branding Manager' },
];

const ROLE_COLORS: Record<string, string> = {
  firm_admin: 'red', senior_advocate: 'blue', panel_advocate: 'green',
  paralegal: 'default', tenant_branding_manager: 'orange',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form] = Form.useForm();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => usersApi.create(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); form.resetFields(); message.success('User created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); form.resetFields(); message.success('User updated'); },
  });

  const columns = [
    { title: 'Name', key: 'name', render: (_: any, r: any) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (role: string) => <Tag color={ROLE_COLORS[role]}>{role?.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Active', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Last Login', dataIndex: 'lastLoginAt', key: 'lastLoginAt',
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY HH:mm') : '—',
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: any) => (
        <Button size="small" onClick={() => { setEditUser(r); form.setFieldsValue(r); }}>Edit</Button>
      ),
    },
  ];

  return (
    <>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>User Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add User</Button>
      </Space>

      <Table loading={isLoading} dataSource={users ?? []} columns={columns} rowKey="id" />

      <Modal
        title="Add User"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="keycloakId" label="Keycloak ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={ROLES} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit User"
        open={!!editUser}
        onCancel={() => { setEditUser(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => updateMutation.mutate({ id: editUser?.id, ...v })}>
          <Form.Item name="firstName" label="First Name"><Input /></Form.Item>
          <Form.Item name="lastName" label="Last Name"><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Select options={ROLES} /></Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
