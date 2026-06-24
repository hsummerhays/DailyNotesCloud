# DailyNotesCloud

DailyNotesCloud is a cloud-native notes and tasks platform built with a TypeScript stack. It is designed to be containerized and deployed to Google Cloud Platform (GCP).

## Architecture

- **Frontend**: Next.js (React + TypeScript) in the `/frontend` directory.
- **Backend**: Express (Node.js + TypeScript) in the `/backend` directory.
- **Database**: PostgreSQL (managed via GCP Cloud SQL in production, local container in development).

## Local Development Setup

To run the application locally using Docker Compose, you need Docker installed on your machine.

### Prerequisites

- Node.js (v22 or higher)
- Docker and Docker Compose

### Running the Services

1. Clone the repository and navigate to the project root:
   ```bash
   cd c:\HughApps\DailyNotesCloud
   ```

2. Copy `backend/.env.example` to `backend/.env` (defaults already match Docker Compose).

3. Start the local environment using Docker Compose:
   ```bash
   docker compose up --build
   ```

4. Apply database migrations and seed demo data (first run only):
   ```bash
   cd backend
   npm run migrate:up
   npm run db:seed
   ```

5. Access the services:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`
   - Database: `localhost:5432`

## Database Migrations

Schema changes live in `backend/migrations/` as plain SQL files (managed by
[node-pg-migrate](https://github.com/salsita/node-pg-migrate)), not in
`seed.ts` -- `seed.ts` only inserts demo data and assumes migrations have
already run.

```bash
cd backend
npm run migrate:up               # apply all pending migrations
npm run migrate:down             # roll back the most recent migration
npm run migrate:create <name>    # scaffold a new migration
```

## Testing

Both apps have a `test` script:

```bash
cd backend && npm test    # vitest + supertest, DB layer mocked
cd frontend && npm test   # vitest + React Testing Library
```

CI (`.github/workflows/ci.yml`) runs both test suites, both production
builds, and a no-push Docker build of both images on every push and PR.

## Project Structure

```text
├── .github/workflows/   # CI (lint/build/test, Docker build)
├── backend/             # Express + TypeScript API
│   └── migrations/      # node-pg-migrate SQL migrations
├── frontend/            # Next.js frontend application
├── k8s/                 # Kubernetes deployment manifests
└── docker-compose.yml   # Multi-container local orchestration
```

## GCP & GKE Deployment

### 1. Build and Push Containers to Google Artifact Registry (GAR)

Set up a Google Artifact Registry repository and run the following commands to build and push the production images:

```bash
# Define project and registry variables
PROJECT_ID="YOUR_GCP_PROJECT"
REGION="us-central1"
REPO_NAME="dailynotescloud"

# Build the production Docker images
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest ./backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest ./frontend

# Push the images to Google Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend:latest
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/frontend:latest
```

### 2. Update Manifest Placeholders

1. In `k8s/service-account.yaml`, update the IAM annotation with your GCP Service Account email.
2. In `k8s/backend.yaml` and `k8s/frontend.yaml`, replace `gcr.io/YOUR_GCP_PROJECT/...` with your actual Artifact Registry image paths, and `:latest` with an immutable tag (e.g. the git SHA) per deploy.
3. In `k8s/backend.yaml`, update the `cloud-sql-proxy` sidecar argument with your Cloud SQL instance connection name (`PROJECT:REGION:INSTANCE`), and set `CORS_ORIGIN` to your real domain.
4. In `k8s/managed-certificate.yaml`, replace `YOUR_DOMAIN` with the domain you'll point at the Ingress's static IP.
5. Copy `k8s/secrets.example.yaml` to `k8s/secrets.yaml` (gitignored) and fill in real database credentials. Never commit this file -- in production, prefer sourcing it from Secret Manager (e.g. the Secret Manager CSI driver) instead.

### 3. Deploy to GKE Cluster

Apply the manifests to your cluster:

```bash
# Apply Service Accounts, IAM bindings, and DB credentials
kubectl apply -f k8s/service-account.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy frontend and backend workloads
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Create the managed TLS certificate, then the Ingress / HTTP(S) Load Balancer
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml
```

Once the Ingress controller provisions the load balancer, run `kubectl get ingress` to find the public IP address of your application, and point your domain's DNS at it. `kubectl describe managedcertificate dailynotescloud-cert` shows certificate provisioning status (`Provisioning` -> `Active`); HTTPS won't work until it's `Active`.
