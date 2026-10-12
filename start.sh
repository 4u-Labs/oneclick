#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
exec "${ONECLICK_PYTHON:-/usr/bin/python3}" server.py "${1:-8775}"
