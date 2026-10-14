# 🚀 Vercel Deployment Guide for ARORA ESPORTS

This guide walks you through deploying the **ARORA ESPORTS Full-Stack Platform** (Vite React + Express API Serverless Functions) to **Vercel** with a single unified domain and zero CORS issues.

---

## 📋 Overview of Architecture on Vercel

```
[ User Browser ]
       │
       ▼
[ https://arora-esports.vercel.app ]
       ├── /api/*   ──────▶ Vercel Serverless Function (Express API in `api/index.ts`)
       └── /*       ──────▶ Static React SPA (Vite output from `frontend/dist`)
                              │
                              ▼
               [ Cloud PostgreSQL (Neon / Supabase) ]
```

- **Single Domain**: Frontend and API share the exact same origin.
- **Secure Sessions**: HTTP-Only `SameSite=Lax` cookies work without cross-origin third-party cookie restrictions.
- **Auto-Scaling**: Express endpoints run as high-performance Vercel serverless functions.

---

## Step 1: Set Up Cloud PostgreSQL Database (2 minutes)

Since Vercel hosts serverless compute, you need a cloud-hosted PostgreSQL database. We recommend **[Neon](https://neon.tech)** (free tier, instant provisioning, serverless connection pooling) or **[Supabase](https://supabase.com)**.

1. Go to **[Neon.tech](https://neon.tech)** and sign up for a free account.
2. Click **Create Project**, name it `arora-esports`.
3. Copy your **Pooled Connection String**. It looks like:
   ```
   postgresql://neondb_owner:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Run Database Migrations & Create Admin

Run migrations from your terminal to create the database schema in your Neon database:

### 1. Apply Database Schema Migrations:
```powershell
$env:DATABASE_URL="your_neon_connection_string_here"
npm run migrate
```
*(On Linux/macOS: `DATABASE_URL="your_neon_connection_string_here" npm run migrate`)*

### 2. (Optional) Seed Sample Tournaments:
```powershell
$env:DATABASE_URL="your_neon_connection_string_here"
npm run seed
```

### 3. Provision Initial Admin Account:
```powershell
$env:DATABASE_URL="your_neon_connection_string_here"
npm run provision:admin
```
Follow the prompt to set your admin email and password/OTP.

---

## Step 3: Push Changes to GitHub

Commit the deployment configuration files and push them to your repository:

```powershell
git add .
git commit -m "feat: configure full-stack monorepo deployment for Vercel"
git push origin main
```

---

## Step 4: Import Project into Vercel

1. Log in to your **[Vercel Dashboard](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `ARORAGREEN` (or your repository name).
4. In the **Configure Project** screen:
   - **Framework Preset**: Select **Other** (or leave default Vite).
   - **Root Directory**: Leave as `./` (the root of the repository).
   - **Build Command**: `npm run build --workspace=frontend` *(auto-configured by `vercel.json`)*.
   - **Output Directory**: `frontend/dist` *(auto-configured by `vercel.json`)*.

---

## Step 5: Configure Environment Variables in Vercel

Under the **Environment Variables** section in the Vercel import page, add the following variables:

| Variable Name | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations and security |
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | Your Neon / Supabase database connection string |
| `JWT_SECRET` | *(Random 32+ character string)* | Secret for auth tokens & session signing |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host for OTP verification emails |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_SECURE` | `false` | TLS setting |
| `SMTP_USER` | `your_gmail@gmail.com` | Your Gmail address |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | 16-character Google App Password |
| `EMAIL_FROM` | `"ARORA ESPORTS <your_gmail@gmail.com>"` | Sender email display |

> 💡 **Note on `VITE_API_BASE_URL`**: You **do not** need to set this! In production, the frontend automatically defaults to relative `/api`, which hits your Vercel serverless functions on the same domain.

---

## Step 6: Deploy & Verify

1. Click **Deploy**.
2. Vercel will build the frontend and deploy the serverless functions in ~45 seconds.
3. Once deployed, open your live URL (e.g. `https://arora-esports.vercel.app`):
   - **Verify API Healthcheck**: Visit `https://your-domain.vercel.app/api/health` — it should return:
     ```json
     {
       "status": "healthy",
       "platform": "ARORA ESPORTS API",
       "environment": "production",
       "serverless": true,
       "timestamp": "..."
     }
     ```
   - **Test Authentication**: Open `https://your-domain.vercel.app/login`, send an OTP, and log in.
   - **Test Admin Panel**: Navigate to `https://your-domain.vercel.app/admin/overview`.
