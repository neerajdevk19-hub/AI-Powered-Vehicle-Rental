# ☁️ DriveAI - Serverless PaaS Cloud Deployment Guide (Vercel + Render + Neon + Qdrant Cloud)

This guide provides a step-by-step walkthrough for deploying the **DriveAI Platform** using modern, free-tier-friendly **Managed Cloud Platforms (PaaS)** without needing to manage Linux servers or SSL manually.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    User([User / Browser]) <-->|HTTPS| Vercel[Vercel / Netlify: React Frontend]
    Vercel <-->|REST & WebSockets| RenderAPI[Render / Railway: NestJS Backend Docker]
    RenderAPI <-->|REST| RenderPy[Render / Railway: Python AI Docker]
    RenderAPI <-->|Database URL| Neon[(Neon.tech: Managed PostgreSQL)]
    RenderAPI <-->|Vector API| QdrantCloud[(Qdrant Cloud Cluster)]
    RenderPy <-->|Vector API| QdrantCloud
```

---

## 🛠️ Required Accounts (All Have Free Tiers)

1. **GitHub**: Code repository hosting.
2. **Vercel** (`vercel.com`) or **Netlify**: Frontend hosting.
3. **Render** (`render.com`) or **Railway** (`railway.app`): Containerized backend services.
4. **Neon** (`neon.tech`): Managed Serverless PostgreSQL Database.
5. **Qdrant Cloud** (`cloud.qdrant.io`): Managed Vector Database Cluster.

---

## 📋 Step-by-Step Deployment Walkthrough

### Step 1: Push Code to GitHub
Ensure your latest code is pushed to your GitHub repository:
```bash
git add .
git commit -m "Deploying DriveAI to PaaS Cloud"
git push origin main
```

---

### Step 2: Create Managed PostgreSQL Database on Neon.tech

1. Go to [Neon.tech](https://neon.tech) and sign in.
2. Click **Create Project**, name it `driveai-db`.
3. Select region nearest to your users (e.g. *AWS Asia Pacific - Singapore / Mumbai*).
4. Copy your PostgreSQL Connection String URL:
   ```text
   postgres://alex:secretpassword@ep-cool-sample-123456.ap-southeast-1.aws.neon.tech/driveai?sslmode=require
   ```

---

### Step 3: Create Managed Vector DB on Qdrant Cloud

1. Go to [Qdrant Cloud](https://cloud.qdrant.io) and sign in.
2. Click **Create Cluster** (Select 1GB Free Tier Cluster).
3. Copy your Qdrant Cluster URL and API Key:
   ```text
   QDRANT_URL="https://c82a-cluster-driveai.qdrant.tech:6333"
   QDRANT_API_KEY="your-qdrant-api-key"
   ```

---

### Step 4: Deploy Python AI Microservice on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository.
4. Set configuration:
   - **Name**: `driveai-python-service`
   - **Root Directory**: `python-service`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
5. Add Environment Variables:
   - `QDRANT_URL`: `https://c82a-cluster-driveai.qdrant.tech:6333`
   - `QDRANT_API_KEY`: `your-qdrant-api-key`
6. Click **Create Web Service**. Note your Python Service URL (e.g. `https://driveai-python-service.onrender.com`).

---

### Step 5: Deploy NestJS Backend API on Render

1. On Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Set configuration:
   - **Name**: `driveai-backend-api`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free`
4. Add Environment Variables:
   ```env
   PORT=3000
   DATABASE_URL="postgres://alex:secretpassword@ep-cool-sample-123456.ap-southeast-1.aws.neon.tech/driveai?sslmode=require"
   GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
   GEMINI_MODEL="gemini-3.6-flash"
   PYTHON_SERVICE_URL="https://driveai-python-service.onrender.com"
   QDRANT_URL="https://c82a-cluster-driveai.qdrant.tech:6333"
   ```
5. Click **Create Web Service**.
6. Once deployed, run Database Push & Seed from Render Shell tab:
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```
7. Note your Backend URL (e.g. `https://driveai-backend-api.onrender.com`).

---

### Step 6: Deploy React Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** ➔ **Project**.
2. Import your `vechical` GitHub repository.
3. Set configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   ```env
   VITE_API_URL="https://driveai-backend-api.onrender.com"
   ```
5. Click **Deploy**.

Vercel will build and launch your frontend at `https://vechical-driveai.vercel.app` with automatic HTTPS SSL certificates!

---

## 🔄 Updating / Redeploying Code

Whenever you push new commits to your `main` branch on GitHub:
- **Vercel** automatically rebuilds and redeploys the frontend.
- **Render** automatically rebuilds and redeploys backend Docker containers.

---

## ✅ Post-Deployment Verification

1. Open your Vercel URL in your browser: `https://vechical-driveai.vercel.app`.
2. Test AI Chat: *"Find me an automatic SUV near me"*.
3. Test Policy RAG: *"What is the cancellation policy?"*.
4. Test Live Map: Check WebSocket GPS tracking animation.
