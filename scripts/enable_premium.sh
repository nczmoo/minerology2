#!/usr/bin/env bash
# Remove the no-premium toggle file
TOGGLEFILE=".no_premium_requests"
if [ -f "$TOGGLEFILE" ]; then
  rm -f "$TOGGLEFILE"
  echo "Removed $TOGGLEFILE — premium requests may be re-enabled (assistant will still ask for confirmation)."
else
  echo "$TOGGLEFILE not present — premium requests already allowed."
fi
