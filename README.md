# ARORA ESPORTS — Full-Stack Free Fire Tournament Platform

> **A Complete, Professional, Production-Oriented Esports Platform Built From Scratch.**  
> Features 4-player squad registration, passwordless email OTP authentication, manual UPI payment verification, protected match room credentials with manual T-10 minute dispatch, role-based admin controls, and published results.

---

## 🎮 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (`pg`), Nodemailer (Gmail SMTP), HTTP-only cookies
- **Database**: PostgreSQL (Local PostgreSQL or Neon PostgreSQL serverless)
- **Design System**: Dark esports theme (`#050B10` Midnight, `#071A20` Deep Teal, `#00F5A0` Neon Green, `#00D9FF` Cyan, `#EAF4F4` Ice White, `#18333A` Border)

---

## 📁 Project Directory Layout

```text
ARORA-ESPORTS/
├── backend/
│   ├── migrations/
│   │   └── 001_initial_schema.sql         # 18 PostgreSQL tables, indexes, constraints
│   ├── src/
│   │   ├── config/                        # Environment & typed config
│   │   ├── db/
│   │   │   └── pool.ts                    # PG Pool & transaction helper (withTransaction)
│   │   ├── middleware/
│   │   │   └── auth.ts                    # HTTP-only session verification & requireAdmin
│   │   ├── routes/
│   │   │   ├── admin.routes.ts            # KPIs, user suspension, audit logs
│   │   │   ├── auth.routes.ts             # Passwordless 6-digit OTP & session cookies
│   │   │   ├── matches.routes.ts          # Match schedules & T-10m manual credential dispatch
│   │   │   ├── notifications.routes.ts    # In-app alerts & broadcast dispatches
│   │   │   ├── payments.routes.ts         # Manual UPI UTR submission & admin audit approval
│   │   │   ├── registrations.routes.ts    # 4-player squad registration & slot allocation
│   │   │   ├── results.routes.ts          # Placements, kills, points, prize money publishing
│   │   │   ├── settings.routes.ts         # Genuine UPI ID, QR assets, rules text
│   │   │   ├── squads.routes.ts           # 1 Captain + 3 Teammates roster manager
│   │   │   └── tournaments.routes.ts      # BRS tournaments CRUD & filter engine
│   │   ├── scripts/
│   │   │   ├── migrate.ts                 # Database migration runner
│   │   │   ├── provision-admin.ts         # Secure CLI script for initial admin role
│   │   │   ├── seed.ts                    # Default settings, rules & sample tournaments
│   │   │   └── test-workflow.ts           # Automated 15/15 critical workflow test suite
│   │   ├── services/
│   │   │   ├── audit.ts                   # Secure audit logging (no secrets stored)
│   │   │   ├── mailer.ts                  # Nodemailer Gmail SMTP + dev console fallback
│   │   │   └── otp.ts                     # Cryptographic OTP generator & SHA-256 hash
│   │   └── index.ts                       # Express server bootstrap & security headers
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── assets/
│   │   │   └── arora_upi_qr.svg           # Genuine UPI QR Code vector asset
│   │   └── logo.svg                       # Original ARORA ESPORTS angular crest logo
│   ├── src/
│   │   ├── components/                    # BrandLogo, Navbar, Footer, UI components
│   │   ├── context/                       # AuthContext (me, session, isAdmin)
│   │   ├── pages/
│   │   │   ├── admin/                     # 12 Admin operational pages
│   │   │   ├── player/                    # 9 Player dashboard pages
│   │   │   └── public/                    # 12 Public pages (Home, Tournaments, Rules, etc.)
│   │   ├── services/                      # API client (credentials: 'include')
│   │   ├── types/                         # TypeScript interfaces
│   │   ├── App.tsx                        # Router map for 33 connected pages
│   │   ├── index.css                      # Tailwind styling & gaming clip-paths
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── start-dev.ps1                          # PowerShell startup script for both servers
└── README.md
```

---

## ⚡ Windows PowerShell Step-by-Step Setup

Follow these exact commands in Windows PowerShell:

### 1. Prerequisites Check
Ensure Node.js v18+ is installed:
```powershell
node -v
npm -v
```

### 2. Install Dependencies

Install Backend dependencies:
```powershell
cd ARORA-ESPORTS\backend
npm install
```

Install Frontend dependencies:
```powershell
cd ..\frontend
npm install
cd ..
```

---

### 3. Database Setup (Neon PostgreSQL or Local PostgreSQL)

Create a brand-new, independent database (e.g., `arora_esports`).  
If using Neon:
1. Create a project at [https://console.neon.tech](https://console.neon.tech)
2. Copy the Connection String (URI).

Configure `ARORA-ESPORTS/backend/.env`:
```ini
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Neon PostgreSQL or Local Database URL:
DATABASE_URL=postgresql://username:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/arora_esports?sslmode=require

# Authentication
JWT_SECRET=arora_esports_super_secure_jwt_secret_9381742_prod
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

# Nodemailer with Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM="ARORA ESPORTS <your_gmail_address@gmail.com>"
```

> **Note on Gmail SMTP App Password**:
> 1. Visit your Google Account -> **Security** -> **2-Step Verification**.
> 2. Scroll to **App passwords**.
> 3. Create a password named "Arora Esports".
> 4. Paste the 16-character token into `SMTP_PASS`.
> *(If left blank in local development, ARORA ESPORTS will safely print OTP codes directly to your backend terminal logs so you can test seamlessly without configuration).*

---

### 4. Apply Database Migrations & Seed Data

Run the migration runner:
```powershell
cd ARORA-ESPORTS\backend
npm run migrate
```
Seed the initial website settings, rules, and default tournaments:
```powershell
npm run seed
```

---

### 5. Provision the Initial Administrator (Server-Side)

Run the secure CLI script supplying your admin email:
```powershell
npm run provision:admin -- admin@aroraesports.com
```
*This assigns the `'Admin'` role server-side, records the action in `audit_logs`, and is completely safe to rerun.*

---

### 6. Run Critical Workflow Verification Suite

Execute the automated test suite verifying OTP single-use, 4-player rosters, unique UIDs, duplicate UTR prevention, capacity checks, and credential security:
```powershell
npm run test:workflow
```
*Expected: `📊 Suite Results: 15/15 passed (100%)`*

---

### 7. Start Backend & Frontend

In **Terminal 1 (Backend)**:
```powershell
cd ARORA-ESPORTS\backend
npm run dev
```
*Backend runs at: [http://localhost:4000](http://localhost:4000)*

In **Terminal 2 (Frontend)**:
```powershell
cd ARORA-ESPORTS\frontend
npm run dev
```
*Frontend runs at: [http://localhost:5173](http://localhost:5173)*

*(Or simply execute `./start-dev.ps1` from `ARORA-ESPORTS/` to start both simultaneously).*

---

## 🏆 Key Workflow Walkthroughs

### A. Testing Passwordless Email OTP Login
1. Open [http://localhost:5173/login](http://localhost:5173/login).
2. Enter your email (e.g. `admin@aroraesports.com` or player email).
3. Click **Send Verification Code**.
4. Check your inbox (or check Terminal 1 logs where the 6-digit code is highlighted).
5. Enter the 6 digits. You are securely authenticated with HTTP-only cookies!

### B. Setting Up a 4-Player Squad
1. In the Player Hub, go to **My Squad (Roster)** (`/player/my-squad`).
2. Enter your **Squad Name** (e.g. `ALPHA WARRIORS`).
3. Enter Captain Free Fire IGN & UID.
4. Fill in all 3 Teammate IGNs and distinct UIDs.
5. Click **Save 4-Player Squad Roster**.

### C. Registering for a Tournament & Submitting Manual UPI Payment
1. Navigate to **Tournaments** (`/tournaments`).
2. Select an open tournament (e.g., *Bermuda Pro Clash*).
3. Click **Register Squad**.
4. Scan the official UPI QR code or copy the UPI ID `aroraesports@okaxis`.
5. Enter your bank **UTR Reference Number** (e.g. `428198765432`).
6. Click **Submit UTR For Verification**. Your status changes to `Pending Verification`.

### D. Admin Verification & Auditing
1. Log in with your provisioned Admin email.
2. Click **Admin Panel** in the navbar or go to `/admin/payments`.
3. Locate the pending payment, verify against bank credit, and click **Approve** or **Reject** with reason.
4. Upon approval, the squad slot is officially marked `Confirmed`.

### E. Manual Match Room Credential Release (T-10m)
1. Go to **Room Credentials** (`/admin/credentials`).
2. Enter the Free Fire **Custom Room ID** and **Password**. Click **Save Protected Keys**.
3. At the 10-minute mark, click **SEND MATCH CREDENTIALS**.
4. A confirmation dialog displays the verified eligible captain count.
5. Click **Confirm & Send**. Emails are dispatched via Gmail SMTP and credentials unlock instantly in the player's **Match Room** (`/player/match-room`).

### F. Publishing Official Match Results
1. Navigate to `/admin/results`.
2. Select the tournament.
3. Enter placement (1-12), total kills, points, and prize money.
4. Click **Publish Standings To Public**.
5. Live leaderboards immediately appear on the public **Results** page (`/results`).
