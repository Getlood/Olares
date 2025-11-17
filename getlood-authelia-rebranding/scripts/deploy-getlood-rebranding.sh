#!/bin/bash

# Getlood Authelia Rebranding - Deployment Script
# This script deploys the Getlood rebranding to your Olares cluster

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
echo "  Getlood Authelia Rebranding Deploy  "
echo "======================================="
echo ""

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

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}✗${NC} Namespace $NAMESPACE does not exist."
    exit 1
fi

echo -e "${GREEN}✓${NC} Namespace $NAMESPACE exists"

# Step 1: Check if certificates exist
echo ""
echo -e "${BLUE}[1/7]${NC} Checking certificates..."
if [ ! -f "$PROJECT_DIR/certs/getlood-cert-chain.pem" ] || [ ! -f "$PROJECT_DIR/certs/getlood-server-key.pem" ]; then
    echo -e "${YELLOW}⚠${NC} Certificates not found. Generating now..."
    cd "$SCRIPT_DIR"
    ./generate-getlood-certs.sh
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✓${NC} Certificates ready"

# Step 2: Retrieve existing secrets
echo ""
echo -e "${BLUE}[2/7]${NC} Retrieving existing Authelia secrets..."
if ! kubectl get secret authelia-secrets -n "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}✗${NC} Secret 'authelia-secrets' not found in namespace $NAMESPACE"
    echo "Please ensure Olares Authelia is installed first."
    exit 1
fi

JWT_SECRET=$(kubectl get secret authelia-secrets -n "$NAMESPACE" -o jsonpath='{.data.jwt_secret}' | base64 -d)
SESSION_SECRET=$(kubectl get secret authelia-secrets -n "$NAMESPACE" -o jsonpath='{.data.session_secret}' | base64 -d)
ENCRYPTION_KEY=$(kubectl get secret authelia-secrets -n "$NAMESPACE" -o jsonpath='{.data.encryption_key}' | base64 -d)
HMAC_SECRET=$(kubectl get secret authelia-secrets -n "$NAMESPACE" -o jsonpath='{.data.hmac_secret}' | base64 -d)
PG_PASSWORD=$(kubectl get secret authelia-secrets -n "$NAMESPACE" -o jsonpath='{.data.pg_password}' | base64 -d)

echo -e "${GREEN}✓${NC} Secrets retrieved successfully"

# Step 3: Prepare configuration with secrets
echo ""
echo -e "${BLUE}[3/7]${NC} Preparing configuration..."

# Create a temporary working copy
TEMP_CONFIG="$PROJECT_DIR/configs/getlood-authelia-config.yaml.tmp"
cp "$PROJECT_DIR/configs/getlood-authelia-config.yaml" "$TEMP_CONFIG"

# Replace secrets
sed -i "s|__JWT_SECRET__|$JWT_SECRET|g" "$TEMP_CONFIG"
sed -i "s|__SESSION_SECRET__|$SESSION_SECRET|g" "$TEMP_CONFIG"
sed -i "s|__ENCRYPTION_KEY__|$ENCRYPTION_KEY|g" "$TEMP_CONFIG"
sed -i "s|__HMAC_SECRET__|$HMAC_SECRET|g" "$TEMP_CONFIG"
sed -i "s|__PG_PASSWORD__|$PG_PASSWORD|g" "$TEMP_CONFIG"

# Read and format certificates with proper indentation
CERT_CHAIN=$(cat "$PROJECT_DIR/certs/getlood-cert-chain.pem" | sed 's/^/          /')
PRIVATE_KEY=$(cat "$PROJECT_DIR/certs/getlood-server-key.pem" | sed 's/^/          /')

# Replace certificate placeholders using a temporary file
sed -i "/__ISSUER_CERT_CHAIN__/d" "$TEMP_CONFIG"
sed -i "/__ISSUER_PRIVATE_KEY__/d" "$TEMP_CONFIG"

# Insert certificates at the right place
awk -v cert="$CERT_CHAIN" '
/issuer_certificate_chain: \|/{
    print $0
    print cert
    next
}
/issuer_private_key: \|/{
    print $0
    print "'"$PRIVATE_KEY"'"
    next
}
{print}
' "$TEMP_CONFIG" > "$TEMP_CONFIG.new"
mv "$TEMP_CONFIG.new" "$TEMP_CONFIG"

echo -e "${GREEN}✓${NC} Configuration prepared"

# Step 4: Apply ConfigMaps
echo ""
echo -e "${BLUE}[4/7]${NC} Applying ConfigMaps..."

kubectl apply -f "$TEMP_CONFIG"
kubectl apply -f "$PROJECT_DIR/configs/getlood-assets-configmap.yaml"

echo -e "${GREEN}✓${NC} ConfigMaps applied"

# Clean up temporary file
rm -f "$TEMP_CONFIG"

# Step 5: Backup existing configuration (optional)
echo ""
echo -e "${BLUE}[5/7]${NC} Creating backup of existing configuration..."

BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

kubectl get configmap authelia-configs -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/authelia-configs-backup-$TIMESTAMP.yaml" 2>/dev/null || true
kubectl get deployment authelia-backend -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/authelia-backend-backup-$TIMESTAMP.yaml" 2>/dev/null || true

echo -e "${GREEN}✓${NC} Backup created in $BACKUP_DIR"

# Step 6: Apply Kustomize patches
echo ""
echo -e "${BLUE}[6/7]${NC} Applying Kustomize patches..."

cd "$PROJECT_DIR/kustomize"
kubectl apply -k .

echo -e "${GREEN}✓${NC} Kustomize patches applied"

# Step 7: Restart Authelia
echo ""
echo -e "${BLUE}[7/7]${NC} Restarting Authelia deployment..."

kubectl rollout restart deployment/authelia-backend -n "$NAMESPACE"

echo ""
echo -e "${YELLOW}⏳${NC} Waiting for deployment to be ready..."
kubectl rollout status deployment/authelia-backend -n "$NAMESPACE" --timeout=300s

echo ""
echo -e "${GREEN}✓${NC} Authelia restarted successfully"

# Verification
echo ""
echo "======================================="
echo "       Deployment Completed!          "
echo "======================================="
echo ""
echo "Next steps:"
echo "  1. Check the logs:"
echo "     kubectl logs -f deployment/authelia-backend -n $NAMESPACE"
echo ""
echo "  2. Verify the configuration:"
echo "     kubectl get configmap getlood-authelia-config -n $NAMESPACE -o yaml"
echo ""
echo "  3. Test the authentication:"
echo "     - Login to your Getlood instance"
echo "     - Enable 2FA and check the TOTP issuer shows 'getlood.com'"
echo "     - Check browser cookies for 'getlood_session'"
echo ""
echo "  4. View backups (if needed to rollback):"
echo "     ls -lh $BACKUP_DIR/"
echo ""
echo -e "${GREEN}Happy Getlooding! 🚀${NC}"
