#!/usr/bin/env bash
# Create the no-premium toggle file
TOGGLEFILE=".no_premium_requests"
if [ -f "$TOGGLEFILE" ]; then
  echo "Premium already disabled (file exists: $TOGGLEFILE)"
  exit 0
fi
cat > "$TOGGLEFILE" <<EOF
# Premium requests disabled (created $(date -u))
EOF
echo "Created $TOGGLEFILE — premium requests disabled locally."
