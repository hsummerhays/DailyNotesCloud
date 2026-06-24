# DailyNotesCloud

DailyNotesCloud is a cloud-native notes and tasks platform built with a TypeScript stack. It is designed to be containerized and deployed to Google Cloud Platform (GCP).

## Architecture

- **Frontend**: Next.js (React + TypeScript) in the `/frontend` directory.
- **Backend**: Express (Node.js + TypeScript) in the `/backend` directory.
- **Database**: PostgreSQL (managed via GCP Cloud SQL in production, local container in development).

## Local Development Setup

To run the application locally using Docker Compose, you need Docker installed on your machine.

### Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose

### Running the Services

1. Clone the repository and navigate to the project root:
   ```bash
   cd c:\HughApps\EnterpriseExpressFullStack
   ```

2. Start the local environment using Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Access the services:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5000`
   - Database: `localhost:5432`

## Project Structure

```text
├── backend/             # Express + TypeScript API
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
2. In `k8s/backend.yaml` and `k8s/frontend.yaml`, replace `gcr.io/YOUR_GCP_PROJECT/...` with your actual Artifact Registry image paths.
3. In `k8s/backend.yaml`, update the `cloud-sql-proxy` sidecar argument with your Cloud SQL instance connection name (`PROJECT:REGION:INSTANCE`).

### 3. Deploy to GKE Cluster

Apply the manifests to your cluster:

```bash
# Apply Service Accounts and IAM bindings
kubectl apply -f k8s/service-account.yaml

# Deploy frontend and backend workloads
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Create the Ingress / HTTP(S) Load Balancer
kubectl apply -f k8s/ingress.yaml
```

Once the Ingress controller provisions the load balancer, run `kubectl get ingress` to find the public IP address of your application.
