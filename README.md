# FairwayIQ

FairwayIQ is a full-stack golf performance app: track rounds and handicap, get AI-driven swing feedback from a phone video, follow personalized training plans, and stay motivated through gamification and a social feed.

## Features

- **Swing analysis** — Upload a swing video; a MediaPipe Pose–based ML service extracts biomechanical metrics (shoulder/hip rotation, X-factor, spine consistency, knee flex at address, overswing detection, finish balance) and turns them into actionable feedback.
- **Round & score tracking** — Log rounds per course, track handicap over time, review stats and progress.
- **Courses** — Course data import via an external course API.
- **Training** — Personalized training plans and a drill library, with home-practice flags for drills that don't need a course.
- **Goals & gamification** — Set goals, earn progress through a gamification system to keep practice consistent.
- **Wearables** — Apple Health integration (`react-native-health`) for workout/health data.
- **Social** — Friends, a home club, and a social feed for sharing rounds and progress.
- **Calendar & notifications** — Schedule practice/rounds, push notifications (Expo) and email notifications (Resend).

## Architecture

Monorepo with three npm workspaces plus a standalone Python ML service:

```
apps/mobile/        Expo (React Native) app — expo-router, NativeWind, Zustand, i18next
backend/             Express API — Prisma/PostgreSQL, JWT auth, Zod validation
packages/shared/     Types & utilities shared between mobile and backend
services/swing-ml/   FastAPI service — MediaPipe Pose swing analysis
nginx/               Reverse proxy config
docker-compose.yml   Orchestrates backend, swing-ml, nginx (and DB) for local/prod deployment
```

**Backend** exposes routes for auth, rounds, swings, courses, clubs, goals, training, gamification, wearables, progress, calendar, social, and notifications. Avatars and media are stored via S3-compatible object storage (AWS SDK / Cloudflare R2).

**Mobile** is an Expo Router app styled with Tailwind (NativeWind), using Zustand for state and i18next for localization.

**swing-ml** is a FastAPI service that runs MediaPipe Pose over an uploaded swing video, detects swing phases (address → backswing → top → downswing → impact → follow-through), and computes the biomechanical metrics listed above.

## Tech Stack

`TypeScript` · `Express` · `Prisma` · `PostgreSQL` · `Expo / React Native` · `NativeWind` · `Zustand` · `Python` · `FastAPI` · `MediaPipe` · `OpenCV` · `Docker`

## Getting Started

```bash
npm install

# Backend (needs .env — see backend/.env.example — and a Postgres instance)
npm run db:migrate --workspace=backend
npm run dev:backend

# Mobile
npm run dev:mobile

# Swing analysis service
cd services/swing-ml && pip install -r requirements.txt && uvicorn main:app --reload
```

Or bring up the full stack (backend, swing-ml, nginx) with:

```bash
docker compose up
```

## Status

Actively developed as a personal project — expect rough edges and open issues.
