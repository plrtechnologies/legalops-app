import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Descriptions,
  Tag,
  Button,
  Upload,
  Space,
  Table,
  Spin,
  Tabs,
  message,
} from 'antd';
import { UploadOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { opinionRequestsApi, documentsApi, opinionsApi } from '../../services/api';
import DocumentViewer from '../../components/documents/DocumentViewer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  DOCUMENTS_PENDING: 'gold',
  UNDER_REVIEW: 'blue',
  OPINION_DRAFTED: 'cyan',
  FINAL: 'green',
  REJECTED: 'red',
  PENDING: 'orange',
  PROCESSING: 'blue',
  PROCESSED: 'green',
  FAILED: 'red',
};

export default function OpinionRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: req, isLoading } = useQuery({
    queryKey: ['opinion-request', id],
    queryFn: () => opinionRequestsApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: docs } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.list(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: opinions } = useQuery({
    queryKey: ['opinions', id],
    queryFn: () => opinionsApi.list(id!).then((r) => r.data),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', documentType);
      return documentsApi.upload(id!, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', id] });
      message.success('Document uploaded and queued for processing');
    },
  });

  const createOpinionMutation = useMutation({
    mutationFn: () => opinionsApi.create(id!, {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['opinions', id] });
      navigate(`/opinion-requests/${id}/opinions/${res.data.id}`);
    },
  });

  const [viewDoc, setViewDoc] = useState<{ id: string; filename: string; mimeType?: string } | null>(null);

  if (isLoading) return <Spin />;
  if (!req) return <Text>Opinion request not found</Text>;

  const docColumns = [
    { title: 'Filename', dataIndex: 'originalFilename' },
    { title: 'Type', dataIndex: 'documentType' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('DD MMM YYYY HH:mm'),
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, row: { id: string; originalFilename: string; mimeType?: string }) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setViewDoc({ id: row.id, filename: row.originalFilename, mimeType: row.mimeType })}
        >
          View
        </Button>
      ),
    },
  ];

  const opinionColumns = [
    { title: 'Version', dataIndex: 'version' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, row: { id: string }) => (
        <Button size="small" onClick={() => navigate(`/opinion-requests/${id}/opinions/${row.id}`)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          Request: {req.referenceNumber}
          <Tag color={STATUS_COLORS[req.status]} style={{ marginLeft: 12 }}>
            {req.status.replace(/_/g, ' ')}
          </Tag>
        </Title>
      </Space>

      <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Bank client">{req.bankClient?.name ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Borrower">{req.endCustomer?.name ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Loan type">{req.loanType}</Descriptions.Item>
        <Descriptions.Item label="Loan amount">{req.loanAmount ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Branch code">{req.branchCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Due date">
          {req.dueDate ? dayjs(req.dueDate).format('DD MMM YYYY') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Property" span={2}>
          {req.propertyLocation ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      <Tabs
        defaultActiveKey="documents"
        items={[
          {
            key: 'documents',
            label: `Documents (${docs?.length ?? 0})`,
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Upload
                    customRequest={({ file, onSuccess: onOk }) => {
                      uploadMutation.mutate({ file: file as File, documentType: 'OTHER' });
                      onOk?.('ok');
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadMutation.isPending}>
                      Upload document
                    </Button>
                  </Upload>
                </Space>
                <Table dataSource={docs} columns={docColumns} rowKey="id" size="small" />
              </>
            ),
          },
          {
            key: 'opinions',
            label: `Opinions (${opinions?.length ?? 0})`,
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={createOpinionMutation.isPending}
                    onClick={() => createOpinionMutation.mutate()}
                  >
                    New opinion draft
                  </Button>
                </Space>
                <Table dataSource={opinions} columns={opinionColumns} rowKey="id" size="small" />
              </>
            ),
          },
        ]}
      />

      {viewDoc && (
        <DocumentViewer
          opinionRequestId={id!}
          documentId={viewDoc.id}
          filename={viewDoc.filename}
          mimeType={viewDoc.mimeType}
          open={!!viewDoc}
          onClose={() => setViewDoc(null)}
        />
      )}
    </>
  );
}
