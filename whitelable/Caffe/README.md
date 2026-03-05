# Canteen QR Menu

Production-ready starter for a QR-based canteen menu with:
- Customer mobile web menu
- Admin dashboard to manage categories and items
- PostgreSQL database

## Stack
- Client: React + Vite + TypeScript
- Server: Node.js + Express + TypeScript + Prisma
- DB: PostgreSQL

## Project Structure
- `client/` React web app (customer + admin UI)
- `server/` API + Prisma schema

## 1) Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Environment
Create `server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/canteen?schema=public"
PORT=4010
ADMIN_USERNAME="Nikkis"
ADMIN_PASSWORD="Nikkis@1234"
ADMIN_KEY="nikkis-admin-token"
CORS_ORIGIN="http://localhost:5173"
```

### Start PostgreSQL (Docker)

```bash
docker compose up -d
```

## 2) Install

```bash
cd server && npm install
cd ../client && npm install
```

## 3) Database

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

## 4) Run

Server:
```bash
cd server
npm run dev
```

Client:
```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173` and API on `http://localhost:4010`.

## Admin Access
- Open `/admin` route in client
- Login with username/password:
  - Username: `Nikkis`
  - Password: `Nikkis@1234`
- Session token is stored in browser session for current tab

## Deploy (Render + Vercel)

Backend on Render:
1. Connect repo and deploy from `server/`
2. Use `render.yaml` defaults
3. Set `DATABASE_URL` and `CORS_ORIGIN` (your Vercel app URL)

Frontend on Vercel:
1. Deploy from `client/`
2. Set `VITE_API_URL` to your Render backend URL
3. `vercel.json` rewrite is already added for SPA routes
