#!/bin/sh

# Caminhos
BRANDS_DIR="/app/brands"
LOGO_TARGET="/app/src/assets/logo.png"
FAVICON_TARGET="/app/public/favicon.ico"

# Arquivos personalizados
LOGO_FILE="$BRANDS_DIR/${STACK_NAME}-logo.png"
FAVICON_FILE="$BRANDS_DIR/${STACK_NAME}-favicon.ico"

# Substitui logo se existir
if [ -f "$LOGO_FILE" ]; then
  cp "$LOGO_FILE" "$LOGO_TARGET"
fi

# Substitui favicon se existir
if [ -f "$FAVICON_FILE" ]; then
  cp "$FAVICON_FILE" "$FAVICON_TARGET"
fi

exit 0 