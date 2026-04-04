# Architecture Overview

## System Components

```
Browser (React SPA)
    │
    ▼ HTTPS
nginx Ingress Controller
    ├── /api/* ──▶ NestJS Backend (Port 3000)
    │               ├── PostgreSQL (TypeORM)
    │               ├── Redis (session / cache)
    │               └── Storage (NFS or S3 via STORAGE_DRIVER)
    │
    └── /* ──────▶ nginx (React SPA static files)
```

## Multi-Tenancy

- Each **law firm** is a `Tenant` (identified by `slug`, e.g. `acme-law`)
- All core tables (`legal_cases`, `documents`, `opinions`, `users`) have a `tenantId` column
- **Phase 1**: App-level filtering (`WHERE tenant_id = $1`) on every query
- **Phase 2** (future): PostgreSQL Row Level Security (RLS) policies

## Authentication & RBAC

JWT-based auth. Roles enforced via `@Roles()` decorator + `RolesGuard`:

| Role | Capabilities |
|---|---|
| `SUPER_ADMIN` | Manage tenants, all data |
| `FIRM_ADMIN` | Manage users, cases, assign advocates |
| `PANEL_ADVOCATE` | Create/edit cases, upload docs, draft opinions |
| `REVIEWER` | Review and approve/reject opinions |
| `READONLY` | View only |

## Document Processing Pipeline

```
Upload
  │
  ▼
Storage Upload (NFS / S3)
  │
  ▼
Multilingual OCR (Tesseract / Google Vision)
  │
  ├── confidence >= 0.7 ──▶ Sarvam AI normalize + extract
  │                             │
  │                             ▼
  └── confidence < 0.7  ──▶ Sarvam AI direct document parse
                                │
                                ▼
                        Persist extractedData + language
                                │
                                ▼
                        Opinion Draft Workflow
```

Supported Indian regional languages: Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Bengali.

## Storage Abstraction

Toggle via `STORAGE_DRIVER` env:

- `nfs` – writes to `NFS_STORAGE_PATH` (mounted as K8s PVC with `ReadWriteMany` on NFS)
- `s3` – uses `@aws-sdk/client-s3` with configurable endpoint (MinIO locally, AWS S3 on EKS)

Both drivers implement the `StorageDriver` interface:
- `upload(tenantId, caseId, filename, buffer, mimeType)`
- `getSignedUrl(storagePath, expiresInSeconds)`
- `delete(storagePath)`
- `exists(storagePath)`

## Dual Platform Deployment

| Concern | Local K8s | AWS EKS |
|---|---|---|
| Storage | NFS PVC (`ReadWriteMany`) | S3 bucket (via IRSA) |
| Database | StatefulSet (PostgreSQL 16) | Amazon RDS PostgreSQL |
| Cache | Redis Deployment | Amazon ElastiCache |
| Ingress | nginx-ingress | AWS Load Balancer Controller |
| Images | Local build (IfNotPresent) | ECR |
| Overlay | `deployment/overlays/local` | `deployment/overlays/eks` |

Switch between environments by applying a different Kustomize overlay.
