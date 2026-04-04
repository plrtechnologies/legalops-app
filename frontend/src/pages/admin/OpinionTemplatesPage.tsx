import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Switch, Space, Typography, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { opinionTemplatesApi } from '../../services/api';

const { Title } = Typography;
const { TextArea } = Input;

export default function OpinionTemplatesPage() {
  const { bankClientId } = useParams<{ bankClientId: string }>();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['opinion-templates', bankClientId],
    queryFn: () => opinionTemplatesApi.list(bankClientId!).then((r) => r.data),
    enabled: !!bankClientId,
  });

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      let templateContent = values.templateContent;
      try { templateContent = JSON.parse(templateContent); } catch { /* use as-is */ }
      return opinionTemplatesApi.create({ ...values, bankClientId, templateContent });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opinion-templates', bankClientId] }); setModalOpen(false); form.resetFields(); message.success('Template created'); },
  });

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Loan Type', dataIndex: 'loanType', key: 'loanType' },
    { title: 'Default', dataIndex: 'isDefault', key: 'isDefault', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag> },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag> },
  ];

  return (
    <>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Opinion Templates</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Template</Button>
      </Space>
      <Table loading={isLoading} dataSource={data ?? []} columns={columns} rowKey="id" />

      <Modal title="Add Template" open={modalOpen} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => form.submit()} confirmLoading={createMutation.isPending} width={700}>
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="loanType" label="Loan Type"><Input /></Form.Item>
          <Form.Item name="templateContent" label="Template Content (JSON)" rules={[{ required: true }]}>
            <TextArea rows={8} placeholder='{"sections": [...]}' />
          </Form.Item>
          <Form.Item name="isDefault" label="Default Template" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
