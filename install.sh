#!/usr/bin/env bash
# Forward to installer.sh or run directly
exec bash "$(dirname "$0")/installer.sh" "$@" 2>/dev/null || {
  # If piped directly via curl
  curl -sSL "https://raw.githubusercontent.com/prcgaming/vps-panel/main/installer.sh" | bash -s -- "$@"
}
