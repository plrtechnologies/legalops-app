import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Form, Input, Button, Space, Tag, Typography, Spin, Divider, Card, message, Timeline, Select,
} from 'antd';
import { RobotOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { opinionsApi } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['submit'],
  SUBMITTED_FOR_REVIEW: ['approve', 'comment'],
  CHANGES_REQUESTED: ['submit'],
  APPROVED: ['issue'],
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default', SUBMITTED_FOR_REVIEW: 'blue', CHANGES_REQUESTED: 'orange',
  APPROVED: 'green', ISSUED: 'purple',
};

export default function OpinionsPage() {
  const { opinionRequestId, opinionId } = useParams<{ opinionRequestId: string; opinionId: string }>();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();

  const { data: opinion, isLoading } = useQuery({
    queryKey: ['opinion', opinionId],
    queryFn: () => opinionsApi.get(opinionRequestId!, opinionId!).then((r) => r.data),
    enabled: !!opinionId,
  });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      opinionsApi.update(opinionRequestId!, opinionId!, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opinion', opinionId] }); message.success('Draft saved'); },
  });

  const generateDraftMutation = useMutation({
    mutationFn: () => opinionsApi.generateDraft(opinionRequestId!, opinionId!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['opinion', opinionId] });
      form.setFieldsValue(res.data);
      message.success('AI draft generated');
    },
    onError: () => message.error('Failed to generate AI draft'),
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => {
      if (action === 'submit') return opinionsApi.submit(opinionRequestId!, opinionId!);
      if (action === 'approve') return opinionsApi.approve(opinionRequestId!, opinionId!);
      if (action === 'issue') return opinionsApi.issue(opinionRequestId!, opinionId!);
      return Promise.reject(new Error('Unknown action'));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opinion', opinionId] }),
    onError: (e: Error) => message.error(e.message),
  });

  const commentMutation = useMutation({
    mutationFn: (comment: string) => opinionsApi.addComment(opinionRequestId!, opinionId!, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opinion', opinionId] });
      commentForm.resetFields();
    },
  });

  if (isLoading) return <Spin />;
  if (!opinion) return <Text>Opinion not found</Text>;

  const transitions = TRANSITIONS[opinion.status] ?? [];

  return (
    <>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>Opinion Draft v{opinion.version}</Title>
          <Tag color={STATUS_COLORS[opinion.status]}>{opinion.status.replace(/_/g, ' ')}</Tag>
          {opinion.aiGenerated && <Tag color="geekblue">AI Generated</Tag>}
        </Space>
        <Space>
          {opinion.status === 'DRAFT' && (
            <Button
              icon={<RobotOutlined />}
              loading={generateDraftMutation.isPending}
              onClick={() => generateDraftMutation.mutate()}
            >
              Generate AI Draft
            </Button>
          )}
          {transitions.includes('submit') && (
            <Button type="primary" loading={actionMutation.isPending}
              onClick={() => actionMutation.mutate('submit')}>Submit for Review</Button>
          )}
          {transitions.includes('approve') && (
            <Button type="primary" style={{ background: 'green' }} loading={actionMutation.isPending}
              onClick={() => actionMutation.mutate('approve')}>Approve</Button>
          )}
          {transitions.includes('issue') && (
            <Button type="primary" style={{ background: 'purple' }} loading={actionMutation.isPending}
              onClick={() => actionMutation.mutate('issue')}>Issue Opinion</Button>
          )}
        </Space>
      </Space>

      <Form
        form={form}
        layout="vertical"
        initialValues={opinion}
        onFinish={(v) => saveMutation.mutate(v)}
        disabled={opinion.status === 'ISSUED'}
      >
        <Form.Item name="summaryFindings" label="Summary Findings">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="titleChainAnalysis" label="Title Chain Analysis">
          <TextArea rows={5} />
        </Form.Item>
        <Form.Item name="encumbranceAnalysis" label="Encumbrance Analysis">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="riskObservations" label="Risk Observations">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item name="finalOpinion" label="Final Opinion">
          <TextArea rows={6} />
        </Form.Item>

        <Divider>Recommendation</Divider>

        <Form.Item name="recommendation" label="Recommendation">
          <Select allowClear placeholder="Select recommendation">
            <Select.Option value="POSITIVE">Positive</Select.Option>
            <Select.Option value="NEGATIVE">Negative</Select.Option>
            <Select.Option value="CONDITIONAL">Conditional</Select.Option>
          </Select>
        </Form.Item>

        <Form.List name="conditions">
          {(fields, { add, remove }) => (
            <>
              <Text strong>Conditions</Text>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...field} style={{ marginBottom: 0, flex: 1 }}>
                    <Input placeholder="Enter condition..." />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Condition
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        {opinion.status !== 'ISSUED' && (
          <Button htmlType="submit" loading={saveMutation.isPending}>Save Draft</Button>
        )}
      </Form>

      {opinion.reviewComments?.length > 0 && (
        <>
          <Divider>Review Comments</Divider>
          <Timeline
            items={opinion.reviewComments.map((c: { userId: string; comment: string; createdAt: string }) => ({
              children: (
                <>
                  <Text type="secondary">{dayjs(c.createdAt).format('DD MMM YYYY HH:mm')}</Text>
                  <Paragraph style={{ marginTop: 4 }}>{c.comment}</Paragraph>
                </>
              ),
            }))}
          />
        </>
      )}

      {transitions.includes('comment') && (
        <>
          <Divider>Request Changes</Divider>
          <Form form={commentForm} onFinish={(v) => commentMutation.mutate(v.comment)}>
            <Form.Item name="comment" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Describe what needs to be changed..." />
            </Form.Item>
            <Button htmlType="submit" loading={commentMutation.isPending}>Request Changes</Button>
          </Form>
        </>
      )}
    </>
  );
}
