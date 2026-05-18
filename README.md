# Prowider — Mini Lead Distribution System

A full-stack lead generation and distribution platform built with Next.js and PostgreSQL. Customers submit service enquiries through a public form. The system automatically assigns each lead to exactly 3 providers based on mandatory business rules and a fair round-robin algorithm. Providers see new leads instantly on their dashboard without refreshing the page.

---

## Live Demo

🔗 [https://prowider-mini-lead-distribution-sys.vercel.app](https://prowider-mini-lead-distribution-sys.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Vercel |

---

## Features

- **Public lead form** — customers submit Name, Phone, City, Service, and Description
- **Duplicate prevention** — same phone number cannot submit two leads for the same service (enforced at DB level)
- **Automatic provider assignment** — every lead is assigned to exactly 3 providers instantly
- **Mandatory assignment rules** — certain providers always receive leads for specific services
- **Fair round-robin allocation** — remaining slots distributed fairly, persisted across restarts
- **Monthly quota enforcement** — providers capped at 10 leads per month
- **Real-time dashboard** — providers see new leads without page refresh via SSE
- **Webhook simulation** — quota reset with full idempotency protection
- **Concurrency safe** — handles multiple simultaneous lead submissions correctly

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/request-service` | Public customer form |
| `/dashboard` | Live provider dashboard |
| `/test-tools` | Webhook and concurrency testing panel |

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A PostgreSQL database — free tier at [neon.tech](https://neon.tech)

### 1. Clone the repository

```bash
git clone https://github.com/GaganKhandale/Prowider-Mini-Lead-Distribution-System.git
cd Prowider-Mini-Lead-Distribution-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@your-neon-host/neondb?sslmode=require"
```

### 4. Run migrations and seed database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

This creates all tables and inserts:
- 3 services (Service 1, Service 2, Service 3)
- 8 providers (Provider 1–8), each with monthly quota of 10
- Allocation state cursors for round-robin tracking (one row per service)

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Reset data (fresh start)

```bash
npx prisma migrate reset --force
```

---

## Allocation Algorithm

### Step 1 — Mandatory Assignment

Every lead is first assigned to providers that are required for that service:

| Service | Mandatory Providers |
|---------|-------------------|
| Service 1 | Provider 1 |
| Service 2 | Provider 5 |
| Service 3 | Provider 1 and Provider 4 |

### Step 2 — Round-Robin Fill

After mandatory providers are assigned, remaining slots (to reach exactly 3 total) are filled from a per-service optional pool using a round-robin cursor:

| Service | Optional Pool |
|---------|--------------|
| Service 1 | Providers 2, 3, 4 |
| Service 2 | Providers 6, 7, 8 |
| Service 3 | Providers 2, 3, 5, 6, 7, 8 |

The cursor is stored in the `AllocationState` table and advances after every lead. This ensures providers are picked in rotation — no provider is repeatedly favoured.

**Example for Service 1:**
```
Lead 1 → Provider 1 (mandatory) + Provider 2 + Provider 3  [cursor moves to 2]
Lead 2 → Provider 1 (mandatory) + Provider 4 + Provider 2  [cursor moves to 1]
Lead 3 → Provider 1 (mandatory) + Provider 3 + Provider 4  [cursor moves to 0]
```

Providers at monthly quota (10 leads) are automatically skipped during selection.

---

## Concurrency Handling

All database reads happen **outside** the transaction to keep it short and fast. The write phase uses `prisma.$transaction([...])` with a flat array of operations executed atomically in a single round-trip:

```
1. Update AllocationState cursor
2. Create LeadAssignment rows for all chosen providers
3. Increment monthlyCount for each chosen provider
```

Because all writes are batched into one atomic transaction, concurrent lead submissions cannot corrupt the cursor or produce duplicate assignments. If two leads arrive at the exact same millisecond, one transaction commits first and the second sees the updated cursor, ensuring correct round-robin ordering.

---

## Webhook Idempotency

The quota reset webhook at `POST /api/webhook/quota-reset` accepts `{ eventId, providerId }`.

**On every call:**
1. Look up `eventId` in the `WebhookEvent` table
2. If found → return `{ status: "duplicate" }` immediately — no changes made
3. If not found → reset `monthlyCount` to 0 and insert `eventId` in a single transaction

```
Call 1 with eventId "abc" → quota reset → eventId stored → { status: "processed" }
Call 2 with eventId "abc" → eventId found → no changes   → { status: "duplicate" }
Call 3 with eventId "abc" → eventId found → no changes   → { status: "duplicate" }
```

Calling the webhook 100 times with the same `eventId` resets the quota exactly once.

---

## Database Schema

```
Service          — id, name
Provider         — id, name, monthlyCount, quota
Lead             — id, name, phone, city, description, serviceId, createdAt
                   unique(phone, serviceId)
LeadAssignment   — id, leadId, providerId
                   unique(leadId, providerId)
AllocationState  — id, serviceId, cursorIndex
                   unique(serviceId)
WebhookEvent     — id, eventId, processedAt
                   unique(eventId)
```

---

## Project Structure

```
prowider/
├── app/
│   ├── page.tsx                           # Homepage
│   ├── request-service/page.tsx           # Customer form
│   ├── dashboard/page.tsx                 # Provider dashboard (SSE)
│   ├── test-tools/page.tsx                # Test panel
│   └── api/
│       ├── leads/route.ts                 # POST — submit lead + allocate
│       ├── providers/route.ts             # GET  — all providers with leads
│       ├── events/route.ts                # GET  — SSE stream
│       └── webhook/quota-reset/route.ts   # POST — idempotent quota reset
├── lib/
│   ├── allocate.ts                        # Allocation engine (round-robin)
│   ├── prisma.ts                          # Prisma singleton client
│   └── sse.ts                             # SSE broadcaster
├── prisma/
│   ├── schema.prisma                      # Database schema
│   └── seed.ts                            # Seed: services, providers, cursors
├── .env                                   # DATABASE_URL
└── package.json
```

---


## Test Tools Panel (`/test-tools`)

| Button | What it tests |
|--------|--------------|
| Reset All Quotas | Calls webhook to reset all 8 provider quotas to 10 |
| Call Webhook 5× (same eventId) | Fires same eventId 5 times — verifies only 1 takes effect |
| Generate 10 Leads (concurrent) | Fires 10 simultaneous leads — verifies concurrency safety |
