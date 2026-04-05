export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'legalops',
    user: process.env.DB_USER ?? 'legalops',
    password: process.env.DB_PASSWORD ?? '',
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL ?? 'http://localhost:8080/auth',
    realm: process.env.KEYCLOAK_REALM ?? 'legal-opinion-saas',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'legal-opinion-api',
    get jwksUri() {
      return `${process.env.KEYCLOAK_URL ?? 'http://localhost:8080/auth'}/realms/${process.env.KEYCLOAK_REALM ?? 'legal-opinion-saas'}/protocol/openid-connect/certs`;
    },
    get issuer() {
      return `${process.env.KEYCLOAK_URL ?? 'http://localhost:8080/auth'}/realms/${process.env.KEYCLOAK_REALM ?? 'legal-opinion-saas'}`;
    },
    adminUser: process.env.KEYCLOAK_ADMIN_USER ?? 'admin',
    adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD ?? '',
    adminSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET ?? '',
  },
  cors: process.env.CORS_ORIGIN ?? 'http://localhost',
  storage: {
    driver: (process.env.STORAGE_DRIVER ?? 'local') as 'nfs' | 's3' | 'local',
    nfsPath: process.env.NFS_STORAGE_PATH ?? process.env.LOCAL_STORAGE_PATH ?? '/mnt/documents',
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'legalops-documents',
      accessKey: process.env.S3_ACCESS_KEY ?? '',
      secretKey: process.env.S3_SECRET_KEY ?? '',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    },
  },
  sarvam: {
    apiKey: process.env.SARVAM_API_KEY ?? '',
    baseUrl: process.env.SARVAM_API_BASE_URL ?? 'https://api.sarvam.ai',
    ocrConfidenceThreshold: parseFloat(process.env.SARVAM_OCR_CONFIDENCE_THRESHOLD ?? '0.7'),
  },
  llm: {
    provider: (process.env.LLM_PROVIDER ?? 'openai') as 'openai' | 'anthropic' | 'google' | 'sarvam',
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gpt-4',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS ?? '4096', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE ?? '0.3'),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? 'noreply@legalops.local',
    secure: process.env.SMTP_SECURE === 'true',
  },
});
