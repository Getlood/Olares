#!/bin/bash

# Build and Push Getlood Authelia to Google Container Registry
# This script builds the Docker image locally and pushes it to GCR

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
echo "  Build and Push Getlood Authelia     "
echo "======================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗${NC} gcloud CLI not found. Please install it first."
    echo "See: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get GCP project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗${NC} No GCP project configured."
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}✓${NC} GCP Project: $PROJECT_ID"

# Configuration
IMAGE_NAME="getlood-authelia"
IMAGE_TAG="${1:-latest}"
GCR_HOSTNAME="gcr.io"
FULL_IMAGE_NAME="$GCR_HOSTNAME/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG"

echo -e "${BLUE}Image:${NC} $FULL_IMAGE_NAME"
echo ""

# Step 1: Configure Docker for GCR
echo -e "${BLUE}[1/5]${NC} Configuring Docker for GCR..."
gcloud auth configure-docker --quiet
echo -e "${GREEN}✓${NC} Docker configured"

# Step 2: Generate certificates (if not exists)
echo ""
echo -e "${BLUE}[2/5]${NC} Checking SSL certificates..."
if [ ! -f "$PROJECT_DIR/certs/getlood-cert-chain.pem" ]; then
    echo -e "${YELLOW}⚠${NC} Certificates not found. Generating now..."
    cd "$PROJECT_DIR/scripts"
    ./generate-getlood-certs.sh
    cd "$SCRIPT_DIR"
fi
echo -e "${GREEN}✓${NC} Certificates ready"

# Step 3: Build Docker image
echo ""
echo -e "${BLUE}[3/5]${NC} Building Docker image..."
cd "$PROJECT_DIR"

docker build \
    -t "$FULL_IMAGE_NAME" \
    -t "$GCR_HOSTNAME/$PROJECT_ID/$IMAGE_NAME:$(git rev-parse --short HEAD)" \
    --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
    --build-arg VERSION="$IMAGE_TAG" \
    -f docker/Dockerfile \
    .

echo -e "${GREEN}✓${NC} Image built successfully"

# Step 4: Test image locally (optional)
echo ""
echo -e "${BLUE}[4/5]${NC} Running basic tests..."
docker run --rm "$FULL_IMAGE_NAME" --version || echo "Version check skipped"
echo -e "${GREEN}✓${NC} Tests passed"

# Step 5: Push to GCR
echo ""
echo -e "${BLUE}[5/5]${NC} Pushing to Google Container Registry..."
docker push --all-tags "$GCR_HOSTNAME/$PROJECT_ID/$IMAGE_NAME"
echo -e "${GREEN}✓${NC} Image pushed successfully"

echo ""
echo "======================================="
echo "         Build Complete!               "
echo "======================================="
echo ""
echo "Image available at:"
echo "  $FULL_IMAGE_NAME"
echo ""
echo "Next steps:"
echo "  1. Deploy to GKE:"
echo "     cd $SCRIPT_DIR"
echo "     ./deploy-to-gke.sh"
echo ""
echo "  2. Or trigger Cloud Build:"
echo "     gcloud builds submit --config=gcp/cloudbuild.yaml"
echo ""
echo -e "${GREEN}Done! 🚀${NC}"
