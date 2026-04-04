-- Local e2e seed: creates a deterministic tenant row used by Keycloak demo user.
-- Tenant UUID is intentionally fixed so token claim tenant_id always matches backend DB.
-- NOTE: Table is created by TypeORM synchronize. This script only seeds data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
