# LegalOps App

Implementation workspace for the **Legal Opinion SaaS** described in the product HLD:

- [HLD-Legal-Opinion-SaaS.md](../saas-ideas/HLD-Legal-Opinion-SaaS.md) (authoritative product / architecture spec)

This repo is an **MVP-aligned build**: multi-tenant auth, **opinion requests** (bank client + end customer + templates), documents and opinions workflow, **audit logging**, **tenant branding**, public firm config for sign-in, storage, and deployment assets. Larger HLD items (full LLM stack, notifications, analytics dashboards, RLS, CI/CD) are still out of scope here (see [Disconnects from HLD](#disconnects-from-hld)).

## Repository layout

```
legalops-app/
├── backend/                 # NestJS API (TypeORM, PostgreSQL, Redis)
├── frontend/                # React + TypeScript SPA (Ant Design, keycloak-js)
├── deployment/
│   ├── docker/              # Local e2e: docker-compose + Postgres init seed
│   ├── keycloak/            # Realm JSON import (clients, roles, demo user)
│   └── k8s/
│       ├── local/           # Plain YAML for local cluster (no Kustomize)
│       └── eks/             # Plain YAML for EKS-style prod
└── docs/                    # Runbooks, env matrix, architecture notes
```

## What matches the HLD today

| HLD topic | In this repo |
|-----------|----------------|
| **Multi-tenancy** | `tenant_id` on domain rows; users scoped per tenant |
| **Domain model (core)** | `bank_clients`, `end_customers`, `opinion_templates`, `opinion_requests`, `documents`, `opinions`, `audit_logs` (TypeORM entities + REST API) |
| **Keycloak** | Realm `legal-opinion-saas`, clients `legal-opinion-web` (SPA) + `legal-opinion-api` (bearer). Web client **redirect URIs** include `http://localhost`, **`http://localhost:5173`** (Vite), `127.0.0.1` variants, and `legalops.local` (see `deployment/keycloak/legal-opinion-saas-realm.json`) |
| **JWT** | Same token for UI + API; validated via **JWKS** (not `@nestjs/keycloak-connect`, but equivalent) |
| **RBAC** | Realm roles: `firm_admin`, `senior_advocate`, `panel_advocate`, `paralegal`, `super_admin`, `tenant_branding_manager` |
| **Tenant in token** | User attribute `tenant_id` → claim `tenant_id` (protocol mapper on web client) |
| **Frontend** | `keycloak-js` + PKCE; **welcome** route for branded sign-in (`/welcome?code=…`), then Keycloak with **post-login `redirectUri`** back to the requested app path |
| **Tenant branding** | Authenticated **tenant** settings + branding API; **public** `GET /api/v1/public/tenants/config?code=` or `slug=` (no auth) for login/embed branding |
| **Audit** | Mutable actions recorded on opinion requests, documents, opinions, tenant settings/branding, document pipeline; **reports** `GET /api/v1/reports/audit-logs` + **Audit log** UI |
| **Storage** | Pluggable: `local` / `nfs` / `s3` via env |
| **Document AI** | Hybrid pipeline **stub**: OCR service + Sarvam client (HLD also lists GPT/Textract/translation; see disconnects) |

## Keycloak model (one realm, many firms)

- **One** realm and **one** pair of clients for the whole platform.
- **New law firm** = new row in `tenants` + new Keycloak users with the same realm roles and a **`tenant_id` user attribute** matching that tenant’s UUID.
- **No** per-firm Keycloak clients or realms required for normal scale.

## Local e2e (Docker Compose)

From `deployment/docker/`:

```bash
cp .env.example .env
docker compose up --build
```

- **App**: http://localhost (frontend proxies `/api` and `/auth`)
- **API / Swagger**: http://localhost:3000/api/docs
- **Keycloak admin**: http://localhost:8080/auth (admin / see compose for password)

Postgres runs `initdb/*.sql` on **first** volume init; demo tenant UUID is aligned with the realm import user. If you already created the DB volume once, use `docker compose down -v` before re-seeding.

**Vite-only dev** (`npm run dev` on port **5173**): ensure Keycloak **legal-opinion-web** valid redirect URIs include `http://localhost:5173/*` (already in the realm import JSON). Re-import realm or edit the client if your Keycloak volume was created before that change.

## Kubernetes

- **Local**: apply manifests under `deployment/k8s/local/` (uses your existing Postgres; NFS PV for docs).
- **EKS**: manifests under `deployment/k8s/eks/` (S3 + RDS/Elastiache placeholders).

See [docs/local-runbook.md](docs/local-runbook.md).

## Configuration

- Backend / frontend examples: `backend/.env.example`, `frontend/.env.example`
- Optional: `VITE_DEFAULT_TENANT_CODE` — firm `code` for `/welcome` branding when users open `/` without `?code=`
- Full matrix: [docs/env-matrix.md](docs/env-matrix.md)

## Disconnects from HLD

Remaining **gaps or simplifications** vs [HLD-Legal-Opinion-SaaS.md](../saas-ideas/HLD-Legal-Opinion-SaaS.md):

1. **AI / document intelligence** — HLD: pluggable LLM (GPT-4 / Claude / Gemini), Textract, regional translation. Repo: **Sarvam** integration + **stub OCR**; many endpoints are placeholders until wired to real providers.

2. **Opinion authoring** — Workflow (draft → review → issue) and section fields exist; **LLM-assisted opinion generation** from templates + extracted data (HLD §2.3 / §10) is not fully productized.

3. **Master-data UI** — REST APIs exist for **bank clients**, **end customers**, and **opinion templates**, but there are **no dedicated admin list/CRUD screens**; templates and parties are mainly used from the **new opinion request** flow and seeds.

4. **Reporting & analytics** — **Audit log** report is implemented. HLD-style **metrics, TAT, compliance dashboards** are not.

5. **Notifications** — Email / in-app notification engine (HLD) is **not** implemented.

6. **Public config URL** — HLD examples use paths like `GET /tenants/config?code=…`. This repo exposes **`GET /api/v1/public/tenants/config`** (`code` or `slug` query params). Same idea; different path.

7. **Tenant resolution** — **`JwtStrategy`** sets `tenantId` from the token for API use. **`TenantMiddleware`** still exists for header/subdomain-style hints; production should **rely on JWT tenant**, not client-controlled headers alone.

8. **Users** — HLD `keycloak_id` vs app PK: implementation uses **`keycloakId`** plus a generated **`id`** (aligned in spirit).

9. **CI/CD** — HLD Section 13 pipelines are **not** in this repo.

10. **PostgreSQL RLS** — HLD-style tenant hardening via row-level security is **not** enabled; isolation is **application-level** (`tenant_id` filters).

When extending the product, keep the HLD as the north star; prefer new features on **`opinion_requests`** and related entities rather than parallel ad hoc models.
