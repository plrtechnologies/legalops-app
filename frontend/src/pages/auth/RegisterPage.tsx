import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Space, Result, Divider, message } from 'antd';
import { BankOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    firmName: string;
    firmCode: string;
    adminEmail: string;
    loginUrl: string;
  } | null>(null);

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/public/register', values);
      setResult(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Registration failed. Please try again.';
      message.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <Card style={{ width: 550 }}>
          <Result
            status="success"
            title="Firm Registered Successfully!"
            subTitle={`${result.firmName} (${result.firmCode}) has been created.`}
          />
          <div style={{ padding: '0 24px 24px' }}>
            <Paragraph>
              A welcome email with your login credentials has been sent to <strong>{result.adminEmail}</strong>.
            </Paragraph>
            <Paragraph type="secondary">
              Please check your inbox (and spam folder) for the temporary password. You will be prompted to change it on first login.
            </Paragraph>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                block
                size="large"
                onClick={() => navigate(`/welcome?code=${result.firmCode}`)}
              >
                Go to Login
              </Button>
              <Button block onClick={() => { setResult(null); form.resetFields(); }}>
                Register Another Firm
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <Card style={{ width: 520, padding: '8px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BankOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 12 }} />
          <Title level={3} style={{ margin: 0 }}>Register Your Law Firm</Title>
          <Text type="secondary">Create your LegalOps account to get started</Text>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Divider orientation="left" plain>Firm Details</Divider>

          <Form.Item name="firmName" label="Firm Name" rules={[{ required: true, message: 'Enter your law firm name' }]}>
            <Input prefix={<BankOutlined />} placeholder="e.g. Sharma & Associates" size="large" />
          </Form.Item>

          <Form.Item
            name="firmCode"
            label="Firm Code"
            rules={[
              { required: true, message: 'Enter a unique firm code' },
              { pattern: /^[A-Za-z0-9-_]+$/, message: 'Only letters, numbers, hyphens allowed' },
            ]}
            extra="Unique identifier for your firm (used in login URL)"
          >
            <Input placeholder="e.g. SHARMA" size="large" />
          </Form.Item>

          <Form.Item name="contactPhone" label="Contact Phone">
            <Input prefix={<PhoneOutlined />} placeholder="+91 98765 43210" size="large" />
          </Form.Item>

          <Form.Item name="address" label="Office Address">
            <Input.TextArea rows={2} placeholder="Firm office address" />
          </Form.Item>

          <Divider orientation="left" plain>Admin Account</Divider>

          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="adminFirstName" label="First Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input prefix={<UserOutlined />} placeholder="First name" size="large" />
            </Form.Item>
            <Form.Item name="adminLastName" label="Last Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="Last name" size="large" />
            </Form.Item>
          </Space>

          <Form.Item
            name="adminEmail"
            label="Admin Email"
            rules={[
              { required: true, message: 'Enter admin email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
            extra="Login credentials will be sent to this email"
          >
            <Input prefix={<MailOutlined />} placeholder="admin@yourfirm.com" size="large" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Register Firm
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Already registered? </Text>
            <Button type="link" onClick={() => navigate('/welcome')} style={{ padding: 0 }}>
              Sign in here
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
