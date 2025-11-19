#!/bin/bash

# Script to generate SSL certificates for Getlood Authelia OIDC
# These certificates are used to sign JWT tokens in the OIDC flow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/../certs"

# Create certs directory
mkdir -p "$CERT_DIR"

echo "================================"
echo "Getlood Certificate Generator"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[1/4]${NC} Generating CA private key..."
openssl genrsa -out "$CERT_DIR/getlood-ca-key.pem" 4096

echo -e "${BLUE}[2/4]${NC} Generating CA certificate..."
openssl req -new -x509 \
  -key "$CERT_DIR/getlood-ca-key.pem" \
  -out "$CERT_DIR/getlood-ca-cert.pem" \
  -days 3650 \
  -subj "/CN=getlood.com CA"

echo -e "${BLUE}[3/4]${NC} Generating server private key..."
openssl genrsa -out "$CERT_DIR/getlood-server-key.pem" 4096

echo -e "${BLUE}[4/4]${NC} Generating server certificate..."
openssl req -new \
  -key "$CERT_DIR/getlood-server-key.pem" \
  -out "$CERT_DIR/getlood-server.csr" \
  -subj "/CN=getlood.com"

openssl x509 -req \
  -in "$CERT_DIR/getlood-server.csr" \
  -CA "$CERT_DIR/getlood-ca-cert.pem" \
  -CAkey "$CERT_DIR/getlood-ca-key.pem" \
  -CAcreateserial \
  -out "$CERT_DIR/getlood-server-cert.pem" \
  -days 3650

# Create certificate chain (server cert + CA cert)
echo -e "${BLUE}[5/5]${NC} Creating certificate chain..."
cat "$CERT_DIR/getlood-server-cert.pem" "$CERT_DIR/getlood-ca-cert.pem" > "$CERT_DIR/getlood-cert-chain.pem"

# Clean up CSR
rm -f "$CERT_DIR/getlood-server.csr"

echo ""
echo -e "${GREEN}✓${NC} Certificates generated successfully!"
echo ""
echo "Generated files:"
echo "  - $CERT_DIR/getlood-ca-cert.pem       (CA Certificate)"
echo "  - $CERT_DIR/getlood-ca-key.pem        (CA Private Key)"
echo "  - $CERT_DIR/getlood-server-cert.pem   (Server Certificate)"
echo "  - $CERT_DIR/getlood-server-key.pem    (Server Private Key)"
echo "  - $CERT_DIR/getlood-cert-chain.pem    (Certificate Chain)"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Keep the private keys secure (*.pem files with 'key' in the name)"
echo "  2. Use getlood-cert-chain.pem for issuer_certificate_chain"
echo "  3. Use getlood-server-key.pem for issuer_private_key"
echo ""
