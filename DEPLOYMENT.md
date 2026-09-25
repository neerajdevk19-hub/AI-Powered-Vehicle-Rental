# 🚀 Live Deployment Guide: Vercel & Render

This guide outlines step-by-step instructions to deploy the **DriveAI Platform** to production live using **Vercel** (for Frontend) and **Render** (for Backend, Python AI Microservice, and PostgreSQL Database).

---

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Vercel / Render                        │
│                 React Frontend (Vite SPA)                   │
│               https://driveai-app.vercel.app                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                           Render                            │
│                 NestJS Backend API & WebSockets             │
│            https://driveai-backend.onrender.com             │
└──────────────┬──────────────────────────────┬───────────────┘
               │ PostgreSQL Wire              │ HTTP API
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│            Render            ││           Render            │
│     Managed PostgreSQL DB    ││     Python AI Microservice  │
└──────────────────────────────┘└─────────────────────────────┘
```

---

## 🌟 Option A: Deploy Frontend on Vercel + Backend & DB on Render (Recommended)

### Step 1: Deploy Backend & Services on Render

1. **Push your code to GitHub / GitLab**.
2. **Log into [Render Dashboard](https://dashboard.render.com/)**.
3. **Deploy via Render Blueprint**:
   - Click **New +** -> Select **Blueprint**.
   - Connect your Git Repository (`AI-Powered-Vehicle-Rental`).
   - Render will automatically parse [`render.yaml`](file:///home/developer/vechical/render.yaml) and prompt for:
     - `GEMINI_API_KEY`: Enter your Google Gemini API key.
   - Click **Apply**. Render will automatically provision:
     - 🐘 PostgreSQL Database (`driveai-db`)
     - 🐍 Python AI Service (`driveai-python-service`)
     - 🚀 NestJS Backend (`driveai-backend`)

4. **Database Seeding & Migrations**:
   The backend [`Dockerfile`](file:///home/developer/vechical/backend/Dockerfile) automatically runs `npx prisma db push` on startup. To seed initial vehicle and policy data:
   - Go to your `driveai-backend` Web Service on Render.
   - Click **Shell** tab and run:
     ```bash
     npm run prisma:seed
     ```

5. **Copy your Backend URL**:
   Example: `https://driveai-backend-xxxx.onrender.com`

---

### Step 2: Deploy Frontend on Vercel

1. **Log into [Vercel Dashboard](https://vercel.com/new)**.
2. **Import Git Repository**: Select `AI-Powered-Vehicle-Rental`.
3. **Configure Project Settings**:
   - **Root Directory**: Select `frontend` folder (Click Edit -> type `frontend`).
   - **Framework Preset**: `Vite` (Auto-detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   Add the following environment variable:
   - `VITE_API_URL`: `https://driveai-backend-xxxx.onrender.com` (Your Render Backend URL from Step 1)
5. **Click Deploy**.
   Vercel will build and publish your app with SSL enabled automatically!

---

## 🛠️ Option B: Deploy Everything on Render (1-Click Blueprint)

If you prefer to host all services under one platform:

1. Push code to GitHub.
2. Open Render Dashboard -> **New +** -> **Blueprint**.
3. Connect repo -> Set `GEMINI_API_KEY`.
4. Render will deploy all 4 components (Frontend, Backend, Python AI, PostgreSQL).

---

## ⚡ Post-Deployment Verification Checklist

- [ ] **Frontend UI**: Open Vercel URL, check map markers and search filters.
- [ ] **AI Assistant**: Test live Gemini function calls & vector policy RAG queries.
- [ ] **Real-Time GPS**: Verify vehicle markers update on Leaflet map.
- [ ] **Swagger Documentation**: Access `https://your-backend-url.onrender.com/api/docs`.
