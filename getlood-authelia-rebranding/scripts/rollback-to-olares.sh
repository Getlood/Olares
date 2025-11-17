#!/bin/bash

# Rollback Script - Restore Original Olares Authelia Configuration
# This script removes Getlood rebranding and restores Olares defaults

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="os-framework"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "======================================="
echo "   Rollback to Olares Authelia        "
echo "======================================="
echo ""

# Confirm rollback
read -p "Are you sure you want to rollback to Olares configuration? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗${NC} kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}✗${NC} Cannot connect to Kubernetes cluster. Please configure kubectl."
    exit 1
fi

echo -e "${GREEN}✓${NC} kubectl is configured and cluster is accessible"

# Step 1: Remove Getlood ConfigMaps
echo ""
echo -e "${BLUE}[1/4]${NC} Removing Getlood ConfigMaps..."

kubectl delete configmap getlood-authelia-config -n "$NAMESPACE" --ignore-not-found=true
kubectl delete configmap getlood-authelia-assets -n "$NAMESPACE" --ignore-not-found=true

echo -e "${GREEN}✓${NC} Getlood ConfigMaps removed"

# Step 2: Restore original Olares configuration
echo ""
echo -e "${BLUE}[2/4]${NC} Restoring original Olares configuration..."

# Check if we have a backup
BACKUP_DIR="$PROJECT_DIR/backups"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_CONFIG_BACKUP=$(ls -t "$BACKUP_DIR"/authelia-configs-backup-*.yaml 2>/dev/null | head -1)
    LATEST_DEPLOY_BACKUP=$(ls -t "$BACKUP_DIR"/authelia-backend-backup-*.yaml 2>/dev/null | head -1)

    if [ -n "$LATEST_CONFIG_BACKUP" ]; then
        echo -e "${BLUE}  →${NC} Restoring from backup: $(basename $LATEST_CONFIG_BACKUP)"
        kubectl apply -f "$LATEST_CONFIG_BACKUP"
    fi

    if [ -n "$LATEST_DEPLOY_BACKUP" ]; then
        echo -e "${BLUE}  →${NC} Restoring from backup: $(basename $LATEST_DEPLOY_BACKUP)"
        kubectl apply -f "$LATEST_DEPLOY_BACKUP"
    fi
else
    echo -e "${YELLOW}⚠${NC} No backups found. Reapplying original Olares deployment..."

    # Find the Olares authelia deployment file
    OLARES_AUTH_DEPLOY="$PROJECT_DIR/../../framework/authelia/.olares/config/cluster/deploy/auth_backend_deploy.yaml"

    if [ -f "$OLARES_AUTH_DEPLOY" ]; then
        kubectl apply -f "$OLARES_AUTH_DEPLOY"
    else
        echo -e "${RED}✗${NC} Cannot find Olares authelia deployment file"
        echo "Please manually restore the configuration from your Olares installation."
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Original configuration restored"

# Step 3: Restart Authelia
echo ""
echo -e "${BLUE}[3/4]${NC} Restarting Authelia deployment..."

kubectl rollout restart deployment/authelia-backend -n "$NAMESPACE"

echo ""
echo -e "${YELLOW}⏳${NC} Waiting for deployment to be ready..."
kubectl rollout status deployment/authelia-backend -n "$NAMESPACE" --timeout=300s

echo -e "${GREEN}✓${NC} Authelia restarted with Olares configuration"

# Step 4: Verification
echo ""
echo -e "${BLUE}[4/4]${NC} Verification..."

POD_STATUS=$(kubectl get pods -n "$NAMESPACE" -l app=authelia-backend --no-headers 2>/dev/null | awk '{print $3}')

if [ "$POD_STATUS" = "Running" ]; then
    echo -e "${GREEN}✓${NC} Authelia pod is running"
else
    echo -e "${YELLOW}⚠${NC} Authelia pod status: $POD_STATUS"
fi

echo ""
echo "======================================="
echo "      Rollback Completed!             "
echo "======================================="
echo ""
echo "Your Olares Authelia configuration has been restored."
echo ""
echo "Next steps:"
echo "  1. Verify the configuration:"
echo "     kubectl logs -f deployment/authelia-backend -n $NAMESPACE"
echo ""
echo "  2. Test authentication with Olares branding"
echo ""
echo "  3. To redeploy Getlood branding, run:"
echo "     ./deploy-getlood-rebranding.sh"
echo ""
