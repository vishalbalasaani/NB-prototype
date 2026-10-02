# NodeBricks — School Management Platform

A serious, calm, production-ready school management and attendance application designed for institutional administrators, school principals, and attendance staff.

---

## 1. Clean Architecture & Codebase Organization

The codebase has been refactored into a clean, modular structure that cleanly separates frontend presentation, server-side domain services, database definitions, and Supabase infrastructure:

```
nodebricks/
├── assets/                     # Master source branding assets
│   ├── icons/                  # Application icons
│   ├── images/                 # High-resolution illustrations & graphics
│   └── logos/                  # Reusable logo files & transparent emblems
│
├── database/                   # Canonical database definitions & SQL scripts
│   ├── migrations/             # Timestamped SQL migration history
│   ├── schema/                 # Full PostgreSQL DDL (tables, constraints, RLS)
│   └── seed/                   # Demonstration & sample institutional data
│
├── public/                     # Static browser-accessible assets
│   └── images/                 # Runtime logos & web icons
│
├── src/
│   ├── app/                    # Next.js App Router (pages & server API endpoints)
│   │   ├── api/                # Privileged server-side route handlers
│   │   │   ├── attendance/     # Save sessions & dispatch parent notifications
│   │   │   ├── school-data/    # Administrative data hydration endpoint
│   │   │   ├── students/       # Excel roster import endpoint
│   │   │   └── whatsapp/       # Meta WhatsApp Cloud API gateway
│   │   ├── globals.css         # Styling foundation & design system tokens
│   │   ├── layout.tsx          # Root HTML shell & Inter typography
│   │   └── page.tsx            # Main application orchestrator & view router
│   │
│   ├── backend/                # Server-only domain services & calculation engines
│   │   ├── attendance/         # Session lifecycle, working days, percentage math
│   │   ├── auth/               # Server-side authentication & privilege verification
│   │   ├── excel/              # Excel roster & marks sheet parsing
│   │   ├── marks/              # Grade calculations, ranking, class averages
│   │   ├── reports/            # Official student memo & PDF report generation
│   │   ├── whatsapp/           # Meta WhatsApp Business messaging gateway
│   │   └── index.ts            # Central backend domain exports
│   │
│   ├── components/             # Frontend UI presentation components
│   │   ├── admin/              # Management analytics, roster, & school overview
│   │   ├── attendance/         # Take Attendance, Hold register, & History UI
│   │   ├── common/             # Reusable UI primitives (dialogs, toasts, logos)
│   │   ├── login/              # Multi-role authentication interface
│   │   ├── marks/              # Marks upload, grading, & academic results UI
│   │   ├── reports/            # Institutional PDF/Excel reports & charts
│   │   ├── splash/             # Startup splash screen
│   │   └── updates/            # School notice board & announcement composer
│   │
│   ├── hooks/                  # Client-side custom React hooks
│   │   └── use-toast.ts        # Feedback toast notifications
│   │
│   ├── lib/                    # Shared utilities & client wrappers
│   │   ├── supabase/           # Segregated Supabase clients (Public vs Privileged)
│   │   │   ├── client.ts       # Public browser client (RLS-enforced)
│   │   │   ├── server.ts       # Privileged server client (Service Role)
│   │   │   └── index.ts        # Central client export
│   │   ├── data-service.ts     # Institutional data service & offline fallback
│   │   └── utils.ts            # CSS class merger & presentation helpers
│   │
│   └── types/                  # Centralized, strongly-typed TypeScript domain models
│       ├── attendance.ts       # Attendance sessions, records, statuses
│       ├── auth.ts             # User profiles, institutional roles
│       ├── database.ts         # Supabase table definitions & database schema
│       ├── marks.ts            # Examinations, subjects, grading tiers
│       ├── reports.ts          # Report filters, chart datasets
│       ├── students.ts         # Students, classes, sections, parents
│       ├── updates.ts          # Notice board posts & audience types
│       └── index.ts            # Central type re-exports
│
├── supabase/                   # Supabase CLI configuration & functions
│   ├── config.toml             # Local Supabase CLI emulator settings
│   ├── functions/              # Supabase Edge Functions (Deno runtime)
│   └── migrations/             # Supabase CLI-managed migrations
│
├── .env.example                # Sanitized environment variable template
├── .env.local                  # Local secrets (PRIVATE — NEVER COMMITTED)
├── .gitignore                  # Git ignore rules protecting all credentials
├── next.config.ts              # Next.js build & security configuration
├── package.json                # Project dependencies & operational scripts
├── tsconfig.json               # TypeScript path mappings & compiler options
└── README.md                   # System documentation & developer guide
```

---

## 2. Security & Environment Configuration

### Public vs. Privileged Supabase Keys

NodeBricks strictly enforces the separation of public browser variables and server-side privileged keys:

1. **Client / Browser (`src/lib/supabase/client.ts`)**:
   - Accesses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
   - All queries executed from the browser are strictly evaluated through PostgreSQL **Row Level Security (RLS)** policies.
   - Users from School A can never read or modify records belonging to School B.

2. **Server / Privileged (`src/lib/supabase/server.ts` & `src/app/api/`)**:
   - Privileged operations (e.g. system-level batch roster imports, administrative notifications) execute in server route handlers using `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
   - These keys are **never** prefixed with `NEXT_PUBLIC_` and are **never** bundled or exposed to the client browser.

### Local Configuration (`.env.local`)

Copy `.env.example` to create your local `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your actual project values:
```env
# Public Supabase Client (Browser-Safe, RLS Protected)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-browser-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-browser-publishable-key

# Privileged Supabase Server Client (NEVER expose to browser)
SUPABASE_SECRET_KEY=your-supabase-service-role-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# WhatsApp Business API (Server-Only)
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
WHATSAPP_PHONE_NUMBER_ID=your-meta-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-meta-waba-id
```

> **IMPORTANT**: `.gitignore` is pre-configured to strictly ignore `.env`, `.env.local`, `.env.*.local`, and all private key files. Your actual credentials will never be committed to Git.

---

## 3. GitHub Deployment Guide & Key Safety

When deploying this project to GitHub and Vercel/production:

### Step 1: Push Code to GitHub

Your `.env.local` is ignored and will **not** be pushed to GitHub.

```bash
# Add your remote if not already added
git remote add origin https://github.com/vishalbalasaani/NB-prototype.git

# Stage, commit, and push
git add .
git commit -m "refactor: codebase organization and security architecture"
git push -u origin main
```

### Step 2: Configure Environment Variables on Hosting Platform (e.g. Vercel)

Never commit secrets to GitHub. Instead, configure them in your deployment platform's Settings > Environment Variables:

1. In your **Vercel Dashboard**:
   - Go to your Project > **Settings** > **Environment Variables**.
   - Add the public variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) for **Production**, **Preview**, and **Development**.
   - Add the private variables (`SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, etc.) for **Production** and **Preview**.
2. Deploy! Your build will automatically use the securely injected platform secrets.

---

## 4. Local Execution & Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start the local Next.js development server on `http://localhost:3000` |
| `npm run build` | Perform a complete production build and run TypeScript checks |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Execute ESLint across all source files |

---

## 5. Test Accounts (Development & Demo)

The login screen automatically detects role permissions upon sign in:

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Management** | `admin123@gmail.com` | `admin@123` | Institutional Overview, Analytics, Official Reports (PDF / Excel), Marks Import, Student Roster |
| **Attendance Staff** | `attendance123@gmail.com` | `attendance@123` | Daily Attendance Register, Taking Class Attendance, Absentee Parent Alerts, Attendance History |

*(Credentials are omitted from the UI to ensure institutional security).*

---

## 6. Attendance Workflow

1. **Take Attendance**: All enrolled students in each class default to *Present*. Staff only selects absentees.
2. **Hold**: If attendance requires later verification, saving as Hold keeps the session editable until finalization.
3. **Send to Parents / Complete**:
   - Confirming attendance immediately saves records to Supabase.
   - Status transitions to **COMPLETED**.
   - Immediate availability to Attendance History, Admin Analytics, and Official Reports.
   - Staff can trigger WhatsApp parent notifications seamlessly.
