#!/bin/bash

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=9001

# ── Node/npm PATH ─────────────────────────
# WebStorm-gebündelte Node-Version direkt einhängen
NODE_BIN="/Users/larswenner/Library/Application Support/JetBrains/WebStorm2025.3/node/versions/24.13.0/bin"
if [ -d "$NODE_BIN" ]; then
  export PATH="$NODE_BIN:$PATH"
fi

# Fallback: andere Node-Installationen
for d in /opt/homebrew/bin /usr/local/bin; do
  [ -f "$d/npm" ] && export PATH="$d:$PATH" && break
done

if ! command -v npm &>/dev/null; then
  echo "✗ npm nicht gefunden. Bitte Node.js installieren: https://nodejs.org"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FairwayIQ — Start"
echo "  Node: $(node -v)  npm: $(npm -v)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Alte Prozesse killen ─────────────────
echo ""
echo "▸ Stoppe laufende Prozesse..."

kill_port() {
  local pid
  pid=$(lsof -ti tcp:"$1" 2>/dev/null)
  [ -n "$pid" ] && kill -9 $pid 2>/dev/null && echo "  killed :$1" || true
}

kill_port ${BACKEND_PORT}
kill_port 8081
kill_port 8082
kill_port 19000
pkill -f "ts-node-dev.*backend" 2>/dev/null && echo "  killed ts-node-dev" || true
pkill -f "expo start" 2>/dev/null && echo "  killed expo" || true

# ── Dependencies installieren (falls nötig) ───
if [ ! -d "$ROOT/backend/node_modules" ] || [ ! -d "$ROOT/apps/mobile/node_modules" ]; then
  echo ""
  echo "▸ Installiere Dependencies (einmalig)..."
  cd "$ROOT/backend" && npm install
  cd "$ROOT/apps/mobile" && npm install
  echo "  ✓ Dependencies installiert"
fi

# ── .env für Backend ─────────────────────
BACKEND_ENV="$ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  cp "$ROOT/backend/.env.example" "$BACKEND_ENV"
  echo "▸ .env angelegt aus .env.example"
fi
if grep -q "^PORT=" "$BACKEND_ENV"; then
  sed -i '' "s/^PORT=.*/PORT=${BACKEND_PORT}/" "$BACKEND_ENV"
else
  echo "PORT=${BACKEND_PORT}" >> "$BACKEND_ENV"
fi

# ── .env für Mobile (lokale IP ermitteln) ──
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

MOBILE_ENV="$ROOT/apps/mobile/.env"
[ ! -f "$MOBILE_ENV" ] && cp "$ROOT/apps/mobile/.env.example" "$MOBILE_ENV"
sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:${BACKEND_PORT}|" "$MOBILE_ENV"
echo "▸ API URL: http://${LOCAL_IP}:${BACKEND_PORT}"

# ── Backend starten ───────────────────────
echo ""
echo "▸ Starte Backend auf Port ${BACKEND_PORT}..."
cd "$ROOT/backend"
npm run dev > "$ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "  PID: $BACKEND_PID  (Logs: backend.log)"

echo "  Warte auf Backend..."
for i in $(seq 1 25); do
  if curl -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    echo "  ✓ Backend läuft"
    break
  fi
  if [ $i -eq 25 ]; then
    echo "  ✗ Backend nicht erreichbar. Logs:"
    tail -30 "$ROOT/backend.log"
    exit 1
  fi
  sleep 1
done

# ── Expo starten ──────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend  → http://localhost:${BACKEND_PORT}"
echo "  Logs     → $ROOT/backend.log"
echo "  Expo Go  → QR-Code im Terminal scannen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$ROOT/apps/mobile"
npx expo start
