import { useState } from 'react';
import { Modal, Spin } from 'antd';
import { documentsApi } from '../../services/api';

interface DocumentViewerProps {
  opinionRequestId: string;
  documentId: string;
  filename: string;
  mimeType?: string;
  open: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ opinionRequestId, documentId, filename, mimeType, open, onClose }: DocumentViewerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUrl = async () => {
    if (url) return;
    setLoading(true);
    try {
      const res = await documentsApi.getSignedUrl(opinionRequestId, documentId);
      setUrl(typeof res.data === 'string' ? res.data : res.data.url);
    } finally {
      setLoading(false);
    }
  };

  if (open && !url && !loading) loadUrl();

  const isPdf = mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);

  return (
    <Modal
      title={filename}
      open={open}
      onCancel={() => { onClose(); setUrl(null); }}
      footer={null}
      width={900}
      styles={{ body: { minHeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' } }}
    >
      {loading && <Spin size="large" />}
      {url && isPdf && (
        <iframe src={url} style={{ width: '100%', height: 600, border: 'none' }} title={filename} />
      )}
      {url && isImage && (
        <img src={url} alt={filename} style={{ maxWidth: '100%', maxHeight: 600 }} />
      )}
      {url && !isPdf && !isImage && (
        <a href={url} target="_blank" rel="noopener noreferrer">Download {filename}</a>
      )}
    </Modal>
  );
}
