#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
if command -v node >/dev/null 2>&1; then
  node scripts/serve.mjs
elif command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 4173 --bind 127.0.0.1
else
  echo 'Necesitas Node.js 20+ o Python 3. Abre http://localhost:4173 cuando arranque el servidor.'
  exit 1
fi
