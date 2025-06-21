#!/bin/sh

# Caminhos
CERTS_DIR="/app/certs-temp"
CERT_TARGET="/app/certs/production-cert.p12"

echo "STACK_NAME: $STACK_NAME"

# Arquivo personalizado do certificado
CERT_FILE="$CERTS_DIR/${STACK_NAME}-production-cert.p12"

# Cria a pasta certs se não existir
mkdir -p /app/certs

# Substitui certificado se existir
if [ -f "$CERT_FILE" ]; then
  cp "$CERT_FILE" "$CERT_TARGET"
fi

exit 0 