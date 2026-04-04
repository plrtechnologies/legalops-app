# Local Kubernetes Deployment Runbook

This guide deploys LegalOps on a local Kubernetes cluster (k3s, minikube, or Docker Desktop K8s) using NFS storage.

## Prerequisites

- `kubectl` configured for your local cluster
- `kustomize` (built into `kubectl apply -k`) or standalone `kustomize` CLI
- Docker installed (to build images)
- An NFS server accessible from your cluster nodes (or use `hostPath` for single-node dev)
- `nginx-ingress` controller installed on your cluster

## Step 1 – Configure NFS

Edit `deployment/overlays/local/nfs-pvc.yaml` and set your NFS server IP and export path:

```yaml
nfs:
  server: 192.168.1.100   # your NFS server IP
  path: /exports/legalops-documents
```

For single-node development without NFS, you can replace the PV with a `hostPath` PV:

```yaml
hostPath:
  path: /var/legalops-documents
  type: DirectoryOrCreate
```

## Step 2 – Create Secrets

Create the secrets file (do not commit actual values):

```bash
cd deployment/base

# Generate base64 values
echo -n 'your_db_password' | base64
echo -n 'your_jwt_secret_min32chars' | base64
echo -n 'your_jwt_refresh_secret_min32chars' | base64
echo -n 'your_sarvam_api_key' | base64
```

Edit `deployment/base/secret.yaml` and replace all `REPLACE_WITH_BASE64` values.

## Step 3 – Build Docker Images

```bash
cd /path/to/legalops-app

# Build backend
docker build -t legalops-backend:latest ./backend

# Build frontend
docker build -t legalops-frontend:latest ./frontend
```

If using k3s or a remote cluster, load or push images to a registry accessible by the cluster:

```bash
# For k3s: import directly
k3s ctr images import <(docker save legalops-backend:latest)
k3s ctr images import <(docker save legalops-frontend:latest)

# Or push to a local registry
docker tag legalops-backend:latest <registry>/legalops-backend:latest
docker push <registry>/legalops-backend:latest
```

## Step 4 – Deploy

```bash
kubectl apply -k deployment/overlays/local
```

Verify:

```bash
kubectl get pods -n legalops
kubectl get svc -n legalops
kubectl get ingress -n legalops
```

## Step 5 – Run Database Migrations

```bash
kubectl exec -it -n legalops deployment/backend -- npm run migration:run
```

## Step 6 – Seed Initial Tenant + Super Admin

```bash
kubectl exec -it -n legalops deployment/backend -- node -e "
const axios = require('axios');
// Create first tenant via API (with DB synchronize=true for first boot)
axios.post('http://localhost:3000/api/v1/tenants', { slug: 'demo-firm', name: 'Demo Law Firm' })
  .then(r => console.log('Tenant:', r.data))
  .catch(e => console.error(e.response?.data));
"
```

Or seed directly via `psql` on the postgres pod:

```bash
kubectl exec -it -n legalops statefulset/postgres -- psql -U legalops -d legalops -c "
INSERT INTO tenants (id, slug, name, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'demo-firm', 'Demo Law Firm', true, now(), now());
"
```

## Step 7 – Access the App

Add to `/etc/hosts`:

```
127.0.0.1  legalops.local
```

Navigate to `http://legalops.local`.

## Updating the Deployment

```bash
# Rebuild image
docker build -t legalops-backend:latest ./backend

# Restart the pod to pick up new image (IfNotPresent policy)
kubectl rollout restart deployment/backend -n legalops
```

## Teardown

```bash
kubectl delete -k deployment/overlays/local
```

## Troubleshooting

| Symptom | Check |
|---|---|
| Backend pod `CrashLoopBackOff` | `kubectl logs -n legalops deployment/backend` |
| `401 Unauthorized` on all API calls | Check `JWT_SECRET` env var matches what was used to issue tokens |
| Documents not saving | Check NFS PVC is bound: `kubectl get pvc -n legalops` |
| Sarvam API errors | Verify `SARVAM_API_KEY` secret value; check `kubectl logs` for 401/403 |
| Postgres `Connection refused` | Wait for StatefulSet readiness; check DB_HOST is `postgres-svc` |
