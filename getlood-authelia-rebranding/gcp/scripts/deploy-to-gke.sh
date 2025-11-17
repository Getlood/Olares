#!/bin/bash

# Deploy Getlood Authelia to Google Kubernetes Engine (GKE)
# This script deploys the application to a GKE cluster

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================="
echo "  Deploy Getlood Authelia to GKE      "
echo "======================================="
echo ""

# Configuration
GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
GKE_CLUSTER="${GKE_CLUSTER:-getlood-cluster}"
GKE_ZONE="${GKE_ZONE:-us-central1-a}"
NAMESPACE="${NAMESPACE:-auth-system}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗${NC} gcloud CLI not found"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗${NC} kubectl not found"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites OK"
echo -e "${BLUE}Project:${NC} $GCP_PROJECT"
echo -e "${BLUE}Cluster:${NC} $GKE_CLUSTER"
echo -e "${BLUE}Zone:${NC} $GKE_ZONE"
echo -e "${BLUE}Namespace:${NC} $NAMESPACE"
echo ""

# Step 1: Get cluster credentials
echo -e "${BLUE}[1/6]${NC} Getting GKE cluster credentials..."
gcloud container clusters get-credentials "$GKE_CLUSTER" \
    --zone="$GKE_ZONE" \
    --project="$GCP_PROJECT"
echo -e "${GREEN}✓${NC} Connected to cluster"

# Step 2: Create namespace
echo ""
echo -e "${BLUE}[2/6]${NC} Creating namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓${NC} Namespace ready"

# Step 3: Create secrets (from Google Secret Manager)
echo ""
echo -e "${BLUE}[3/6]${NC} Setting up secrets..."

# Check if secrets already exist
if kubectl get secret authelia-secrets -n "$NAMESPACE" &>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Secrets already exist. Skipping creation."
else
    echo "Creating secrets from Google Secret Manager..."

    # Example: Create secrets from Secret Manager
    # You need to create these secrets in Secret Manager first
    kubectl create secret generic authelia-secrets -n "$NAMESPACE" \
        --from-literal=jwt_secret="$(gcloud secrets versions access latest --secret=authelia-jwt-secret 2>/dev/null || echo 'CHANGE_ME')" \
        --from-literal=session_secret="$(gcloud secrets versions access latest --secret=authelia-session-secret 2>/dev/null || echo 'CHANGE_ME')" \
        --from-literal=encryption_key="$(gcloud secrets versions access latest --secret=authelia-encryption-key 2>/dev/null || echo 'CHANGE_ME')" \
        --from-literal=hmac_secret="$(gcloud secrets versions access latest --secret=authelia-hmac-secret 2>/dev/null || echo 'CHANGE_ME')" \
        --from-literal=pg_password="$(gcloud secrets versions access latest --secret=authelia-pg-password 2>/dev/null || echo 'CHANGE_ME')" \
        --from-literal=ldap_password="$(gcloud secrets versions access latest --secret=authelia-ldap-password 2>/dev/null || echo 'adminpassword')" \
        --from-literal=smtp_username="$(gcloud secrets versions access latest --secret=authelia-smtp-username 2>/dev/null || echo '')" \
        --dry-run=client -o yaml | kubectl apply -f -
fi

echo -e "${GREEN}✓${NC} Secrets configured"

# Step 4: Apply ConfigMaps
echo ""
echo -e "${BLUE}[4/6]${NC} Applying ConfigMaps..."
kubectl apply -f "$PROJECT_DIR/gcp/k8s/configmap.yaml" -n "$NAMESPACE"
echo -e "${GREEN}✓${NC} ConfigMaps applied"

# Step 5: Update image reference in deployment
echo ""
echo -e "${BLUE}[5/6]${NC} Updating deployment manifests..."
IMAGE_URL="gcr.io/$GCP_PROJECT/getlood-authelia:$IMAGE_TAG"

# Replace PROJECT_ID placeholder in deployment.yaml
sed "s|gcr.io/PROJECT_ID/getlood-authelia:latest|$IMAGE_URL|g" \
    "$PROJECT_DIR/gcp/k8s/deployment.yaml" | kubectl apply -n "$NAMESPACE" -f -

# Apply other manifests
kubectl apply -f "$PROJECT_DIR/gcp/k8s/service.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_DIR/gcp/k8s/serviceaccount.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_DIR/gcp/k8s/hpa.yaml" -n "$NAMESPACE"
kubectl apply -f "$PROJECT_DIR/gcp/k8s/pdb.yaml" -n "$NAMESPACE"

echo -e "${GREEN}✓${NC} Deployment updated"

# Step 6: Wait for rollout
echo ""
echo -e "${BLUE}[6/6]${NC} Waiting for rollout to complete..."
kubectl rollout status deployment/getlood-authelia -n "$NAMESPACE" --timeout=5m

echo -e "${GREEN}✓${NC} Deployment completed"

# Display status
echo ""
echo "======================================="
echo "     Deployment Successful!            "
echo "======================================="
echo ""

# Get service details
echo "Service details:"
kubectl get svc getlood-authelia-svc -n "$NAMESPACE"

echo ""
echo "Pod status:"
kubectl get pods -n "$NAMESPACE" -l app=getlood-authelia

echo ""
echo "Next steps:"
echo "  1. View logs:"
echo "     kubectl logs -f deployment/getlood-authelia -n $NAMESPACE"
echo ""
echo "  2. Get service endpoint:"
echo "     kubectl get svc getlood-authelia-svc -n $NAMESPACE"
echo ""
echo "  3. Test health endpoint:"
echo "     kubectl run curl-test --image=curlimages/curl:latest --rm -i --restart=Never -n $NAMESPACE \\"
echo "       -- curl -f http://getlood-authelia-svc:9091/api/health"
echo ""
echo -e "${GREEN}Done! 🚀${NC}"
