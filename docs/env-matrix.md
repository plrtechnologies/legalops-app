# Environment Variable Matrix

## Core App

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `3000` | HTTP port |

## Database (PostgreSQL)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | `legalops` | Database name |
| `DB_USER` | Yes | `legalops` | Database user |
| `DB_PASSWORD` | Yes | - | Database password |
| `DB_SSL` | No | `false` | Set `true` for RDS/managed PostgreSQL |

## Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | Yes | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password (if auth enabled) |

## Keycloak (JWT validation via JWKS)

The API does **not** sign JWTs; Keycloak issues tokens. The backend validates bearer tokens using the realm JWKS.

| Variable | Required | Default | Description |
|---|---|---|---|
| `KEYCLOAK_URL` | Yes | `http://localhost:8080/auth` | Keycloak base URL (include `/auth` if using legacy relative path) |
| `KEYCLOAK_REALM` | No | `legal-opinion-saas` | Realm name |
| `KEYCLOAK_CLIENT_ID` | No | `legal-opinion-api` | Audience / resource client (bearer-only) |
| `KEYCLOAK_FRONTEND_CLIENT_ID` | Optional | `legal-opinion-web` | Documented for parity with frontend; not always read by API |

## Storage (driver toggle)

| Variable | Required | Default | Description |
|---|---|---|---|
| `STORAGE_DRIVER` | No | `local` | `local` (dev), `nfs` (K8s PVC mount), or `s3` |
| `LOCAL_STORAGE_PATH` | If `STORAGE_DRIVER=local` | `/tmp/legalops-documents` | Writable directory on the API host |
| `NFS_STORAGE_PATH` | If `STORAGE_DRIVER=nfs` | `/mnt/nfs/legalops-documents` | Absolute path on NFS mount |
| `S3_ENDPOINT` | If `STORAGE_DRIVER=s3` | - | S3-compatible endpoint (omit for AWS S3) |
| `S3_REGION` | If `STORAGE_DRIVER=s3` | `us-east-1` | S3 region |
| `S3_BUCKET` | If `STORAGE_DRIVER=s3` | `legalops-documents` | S3 bucket name |
| `S3_ACCESS_KEY` | If `STORAGE_DRIVER=s3` | - | S3 access key (not needed with IRSA) |
| `S3_SECRET_KEY` | If `STORAGE_DRIVER=s3` | - | S3 secret key (not needed with IRSA) |
| `S3_FORCE_PATH_STYLE` | No | `false` | Set `true` for MinIO |

## Sarvam AI

| Variable | Required | Default | Description |
|---|---|---|---|
| `SARVAM_API_KEY` | Yes (for doc processing) | - | Sarvam AI API subscription key |
| `SARVAM_API_BASE_URL` | No | `https://api.sarvam.ai` | Sarvam API base URL |
| `SARVAM_OCR_CONFIDENCE_THRESHOLD` | No | `0.7` | Below this, skip OCR and use Sarvam direct parse |

## Frontend (Vite)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `/` | Backend API base URL for the browser |
| `VITE_APP_NAME` | No | `LegalOps` | App name shown in UI |
| `VITE_KEYCLOAK_URL` | Yes | - | Keycloak URL (e.g. nginx proxy `http://localhost/auth`) |
| `VITE_KEYCLOAK_REALM` | No | `legal-opinion-saas` | Realm |
| `VITE_KEYCLOAK_CLIENT_ID` | No | `legal-opinion-web` | Public SPA client (PKCE) |
