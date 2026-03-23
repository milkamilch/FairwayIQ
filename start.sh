#!/bin/bash

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=9001

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FairwayIQ — Start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Alte Prozesse killen ─────────────────
echo ""
echo "▸ Stoppe laufende Prozesse..."

# Backend auf Port 9001
fuser -k ${BACKEND_PORT}/tcp 2>/dev/null && echo "  killed :${BACKEND_PORT}" || true

# Expo Metro Bundler (Port 8081 / 8082)
fuser -k 8081/tcp 2>/dev/null && echo "  killed :8081" || true
fuser -k 8082/tcp 2>/dev/null && echo "  killed :8082" || true

# Expo Dev Server (Port 19000 / 19001)
fuser -k 19000/tcp 2>/dev/null && true
fuser -k 19001/tcp 2>/dev/null && true

# ts-node-dev / node Prozesse vom Backend
pkill -f "ts-node-dev.*backend" 2>/dev/null && echo "  killed ts-node-dev" || true
pkill -f "expo start" 2>/dev/null && echo "  killed expo" || true

sleep 1

# ── .env für Backend ─────────────────────
BACKEND_ENV="$ROOT/backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  cp "$ROOT/backend/.env.example" "$BACKEND_ENV"
  echo "▸ .env angelegt aus .env.example"
fi

# PORT in .env auf 9001 setzen
if grep -q "^PORT=" "$BACKEND_ENV"; then
  sed -i "s/^PORT=.*/PORT=${BACKEND_PORT}/" "$BACKEND_ENV"
else
  echo "PORT=${BACKEND_PORT}" >> "$BACKEND_ENV"
fi

# ── .env für Mobile ──────────────────────
LOCAL_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
fi

MOBILE_ENV="$ROOT/apps/mobile/.env"
if [ ! -f "$MOBILE_ENV" ]; then
  cp "$ROOT/apps/mobile/.env.example" "$MOBILE_ENV"
fi
sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:${BACKEND_PORT}|" "$MOBILE_ENV"
echo "▸ API URL: http://${LOCAL_IP}:${BACKEND_PORT}"

# ── Prisma Client generieren ──────────────
echo ""
echo "▸ Generiere Prisma Client..."
cd "$ROOT/backend" && npx prisma generate 2>&1 | grep -E "Generated|Error" || true

# ── Backend starten ───────────────────────
echo ""
echo "▸ Starte Backend auf Port ${BACKEND_PORT}..."
cd "$ROOT/backend"
npm run dev > "$ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "  PID: $BACKEND_PID  (Logs: backend.log)"

# Warte bis Backend bereit ist
echo "  Warte auf Backend..."
for i in $(seq 1 20); do
  if curl -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    echo "  ✓ Backend läuft"
    break
  fi
  if [ $i -eq 20 ]; then
    echo "  ✗ Backend nicht erreichbar. Logs:"
    tail -20 "$ROOT/backend.log"
    exit 1
  fi
  sleep 1
done

# ── Expo starten ──────────────────────────
echo ""
echo "▸ Starte Expo (SDK 54)..."
cd "$ROOT/apps/mobile"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend  → http://localhost:${BACKEND_PORT}"
echo "  Logs     → $ROOT/backend.log"
echo "  Expo Go  → QR-Code scannen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start