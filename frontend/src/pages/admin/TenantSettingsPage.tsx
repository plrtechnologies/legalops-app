import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Space, Switch, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { UploadOutlined } from '@ant-design/icons';
import { tenantApi } from '../../services/api';
import { useTenantBrandingStore } from '../../store/tenant-branding.store';

const { Title, Paragraph } = Typography;

type SettingsForm = {
  name: string;
  code: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  subscriptionTier?: string;
  maxUsers?: number;
};

export default function TenantSettingsPage() {
  const [orgForm] = Form.useForm<SettingsForm>();
  const [brandForm] = Form.useForm<{ primaryColor?: string; secondaryColor?: string; logoUrl?: string; faviconUrl?: string }>();
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoList, setLogoList] = useState<UploadFile[]>([]);
  const [faviconList, setFaviconList] = useState<UploadFile[]>([]);
  const [aiForm] = Form.useForm();
  const [loadingAi, setLoadingAi] = useState(false);
  const loadBranding = useTenantBrandingStore((s) => s.loadBranding);

  const load = async () => {
    try {
      const { data } = await tenantApi.getSettings();
      const d = data as Record<string, unknown>;
      orgForm.setFieldsValue({
        name: d.name as string,
        code: d.code as string,
        slug: d.slug as string,
        contactEmail: (d.contactEmail as string) ?? undefined,
        contactPhone: (d.contactPhone as string) ?? undefined,
        address: (d.address as string) ?? undefined,
        subscriptionTier: d.subscriptionTier as string,
        maxUsers: d.maxUsers as number,
      });
      brandForm.setFieldsValue({
        primaryColor: (d.primaryColor as string) ?? undefined,
        secondaryColor: (d.secondaryColor as string) ?? undefined,
      });
      const settings = (d.settings ?? {}) as Record<string, unknown>;
      const aiSettings = (settings.ai_settings ?? {}) as Record<string, unknown>;
      aiForm.setFieldsValue({
        auto_extract_on_upload: aiSettings.auto_extract_on_upload ?? true,
        auto_generate_opinion_draft: aiSettings.auto_generate_opinion_draft ?? false,
        require_lawyer_review: aiSettings.require_lawyer_review ?? true,
        min_confidence_score: aiSettings.min_confidence_score ?? 0.85,
        supported_regional_languages: aiSettings.supported_regional_languages ?? [],
      });
    } catch {
      message.error('Failed to load tenant settings');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveOrg = async () => {
    setLoadingOrg(true);
    try {
      const values = await orgForm.validateFields();
      await tenantApi.updateSettings(values);
      message.success('Organization settings saved');
      await loadBranding();
      await load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setLoadingOrg(false);
    }
  };

  const saveBranding = async () => {
    setLoadingBrand(true);
    try {
      const values = await brandForm.validateFields();
      const fd = new FormData();
      if (values.primaryColor) fd.append('primaryColor', values.primaryColor);
      if (values.secondaryColor) fd.append('secondaryColor', values.secondaryColor);
      if (values.logoUrl) fd.append('logoUrl', values.logoUrl);
      if (values.faviconUrl) fd.append('faviconUrl', values.faviconUrl);
      if (logoFile) fd.append('logo', logoFile);
      if (faviconFile) fd.append('favicon', faviconFile);
      await tenantApi.updateBranding(fd);
      message.success('Branding updated');
      setLogoFile(null);
      setFaviconFile(null);
      setLogoList([]);
      setFaviconList([]);
      await loadBranding();
      await load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Branding update failed');
    } finally {
      setLoadingBrand(false);
    }
  };

  const saveAi = async () => {
    setLoadingAi(true);
    try {
      const values = await aiForm.validateFields();
      await tenantApi.updateSettings({ settings: { ai_settings: values } });
      message.success('AI settings saved');
      await load();
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Save failed');
    } finally {
      setLoadingAi(false);
    }
  };

  const LANGUAGE_OPTIONS = [
    { value: 'hi', label: 'Hindi' }, { value: 'ta', label: 'Tamil' },
    { value: 'te', label: 'Telugu' }, { value: 'kn', label: 'Kannada' },
    { value: 'ml', label: 'Malayalam' }, { value: 'mr', label: 'Marathi' },
    { value: 'gu', label: 'Gujarati' }, { value: 'bn', label: 'Bengali' },
    { value: 'or', label: 'Odia' }, { value: 'pa', label: 'Punjabi' },
    { value: 'as', label: 'Assamese' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>Tenant settings</Title>
        <Paragraph type="secondary">
          Organization profile and branding (visible to your firm after login). Requires firm admin or delegated branding role.
        </Paragraph>
      </div>

      <Card title="Organization">
        <Form form={orgForm} layout="vertical">
          <Form.Item name="name" label="Firm name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Firm code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="contactPhone" label="Contact phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="subscriptionTier" label="Subscription tier">
            <Input />
          </Form.Item>
          <Form.Item name="maxUsers" label="Max users">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={saveOrg} loading={loadingOrg}>
              Save organization
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Branding">
        <Form form={brandForm} layout="vertical">
          <Form.Item name="primaryColor" label="Primary color (hex)">
            <Input placeholder="#1677ff" />
          </Form.Item>
          <Form.Item name="secondaryColor" label="Secondary color (hex)">
            <Input placeholder="#52c41a" />
          </Form.Item>
          <Form.Item name="logoUrl" label="External logo URL (optional)">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="faviconUrl" label="External favicon URL (optional)">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Upload logo">
            <Upload
              maxCount={1}
              fileList={logoList}
              beforeUpload={(file) => {
                setLogoFile(file);
                setLogoList([{ uid: '-1', name: file.name, status: 'done' }]);
                return false;
              }}
              onRemove={() => {
                setLogoFile(null);
                setLogoList([]);
              }}
            >
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Upload favicon">
            <Upload
              maxCount={1}
              fileList={faviconList}
              beforeUpload={(file) => {
                setFaviconFile(file);
                setFaviconList([{ uid: '-2', name: file.name, status: 'done' }]);
                return false;
              }}
              onRemove={() => {
                setFaviconFile(null);
                setFaviconList([]);
              }}
            >
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={saveBranding} loading={loadingBrand}>
              Save branding
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="AI Settings">
        <Form form={aiForm} layout="vertical">
          <Form.Item name="auto_extract_on_upload" label="Auto-extract data on document upload" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="auto_generate_opinion_draft" label="Auto-generate opinion draft after extraction" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="require_lawyer_review" label="Require lawyer review before issuing" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="min_confidence_score" label="Minimum confidence score for auto-extraction">
            <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supported_regional_languages" label="Supported regional languages">
            <Select mode="multiple" options={LANGUAGE_OPTIONS} placeholder="Select languages..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={saveAi} loading={loadingAi}>
              Save AI settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
