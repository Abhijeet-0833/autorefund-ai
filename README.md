# AutoRefund AI — Customer Support Agent for E-Commerce Refund Processing

Production-ready Next.js 15 web application featuring an AI Customer Support Agent for E-Commerce Refund Processing with **deterministic server-side policy enforcement**.

---

## 🌟 Overview

AutoRefund AI is designed to solve a critical issue in AI agent architectures: **financial reliability and policy compliance**. While OpenAI models handle natural language understanding and tool invocation planning, **the LLM is never the final authority on money approvals**. 

All refund requests are evaluated against a strict, server-side **Deterministic Policy Engine** (`lib/policy/refundPolicy.ts`) before any decision is executed in the CRM database.

---

## ✨ Features

- **🤖 Function Calling AI Agent Loop**: OpenAI tool-orchestration loop dynamically invoking database lookup and policy validation tools.
- **🛡️ Deterministic Backend Policy Engine**: Server-side policy engine that hard-enforces rules regardless of LLM generation.
- **📊 15 Seeded CRM Mock Customers**: Pre-populated database featuring realistic customers, order histories, delivery dates, and product categories.
- **⚡ Real-Time Live Execution Logs**: Structured audit logs capturing step-by-step agent tool calls, timestamps, parameters, and decision status.
- **🖥️ Admin Dashboard & Analytics**: Audit portal for monitoring total requests, approval rates, dollar totals, recent audit trails, and CRM customer records.
- **🚀 Dual Mode Agent Runner**: Includes an automatic deterministic agent fallback so the app, tests, and demo work 100% reliably with or without an active `OPENAI_API_KEY`.
- **🧪 100% Automated Test Coverage**: Vitest suite verifying valid approvals, expired window denials, already refunded denials, digital category denials, and ownership mismatches.

---

## 🏗️ Architecture

```text
User Request (Next.js Chat UI)
          │
          ▼
   Next.js API (/api/chat)
          │
          ▼
    OpenAI AI Agent Loop
          │ (Tool Calls: getCustomer, getOrder, validateRefundEligibility)
          ▼
   CRM Database (Prisma ORM)
          │
          ▼
   Deterministic Policy Engine ───► Hard Enforcement (30-Day Window, Category Check, Ownership)
          │
          ▼
    APPROVE / DENY Decision ──────► Recorded in Database & Execution Audit Log
          │
          ▼
Customer Explanation + Admin Dashboard Telemetry
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Vanilla Tailwind CSS + Glassmorphic UI design system
- **Database & ORM**: Prisma ORM with SQLite (`dev.db` for zero-setup local dev/testing) & PostgreSQL support
- **AI Agent**: OpenAI Function/Tool Calling API (`gpt-4o-mini`)
- **Validation**: Zod schema validation for all API inputs and tool parameters
- **Testing**: Vitest test runner
- **Icons**: Lucide React

---

## 📜 Strict Refund Policy Rules

1. **30-Day Delivery Window**: Requests are valid strictly within **30 calendar days** from the delivery date.
2. **Order Ownership**: Customer email or ID must match the order owner.
3. **Delivery Status**: Order status must be `DELIVERED`.
4. **Already Refunded Check**: Orders marked as `isRefunded: true` or status `REFUNDED` cannot be refunded again.
5. **Product Category Exclusions**: Non-refundable categories:
   - `Digital Download` / `Digital Software`
   - `Gift Card`
   - `Perishable`
   - `Customized` / `Personalized`
6. **Maximum Amount Check**: Refund amount cannot exceed original purchase total.
7. **Invalid Information**: Invalid or missing customer/order info results in an automatic **DENY**.

---

## 👥 Seeded CRM Customer Test Scenarios (15 Customers)

| Order ID | Customer Name | Email | Scenario / Test Case | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **ORD-1001** | Sarah Jenkins | `sarah.jenkins@example.com` | Delivered 10 days ago ($149.99 Electronics) | **APPROVE** |
| **ORD-1002** | Mark Davis | `mark.davis@example.com` | Delivered 45 days ago ($299.00 Smart Watch - Window Exceeded) | **DENY** |
| **ORD-1003** | Elena Rostova | `elena.rostova@example.com` | Delivered 12 days ago ($79.50 Leather Wallet - Already Refunded) | **DENY** |
| **ORD-1004** | David Chen | `david.chen@example.com` | Delivered 5 days ago ($59.99 Software Key - Digital Category) | **DENY** |
| **ORD-1001** | Amanda Taylor | `amanda.taylor@example.com` | Amanda querying ORD-1001 owned by Sarah (Ownership Mismatch) | **DENY** |
| **ORD-1006A** | James Wilson | `james.wilson@example.com` | Customer owns 2 orders. ORD-1006A delivered 7 days ago | **APPROVE** |
| **ORD-1007** | Robert Martinez | `robert.martinez@example.com` | Custom Engraved Ring (Customized Category) | **DENY** |
| **ORD-1008** | Emily Watson | `emily.watson@example.com` | Order status SHIPPED (In Transit, Not Delivered) | **DENY** |
| **ORD-1009** | Michael Brown | `michael.brown@example.com` | $100 Digital Gift Card (Gift Card Category) | **DENY** |
| **ORD-1010** | Sophia Garcia | `sophia.garcia@example.com` | Ergonomic Office Chair ($350.00, delivered 16 days ago) | **APPROVE** |

---

## 🚀 Quick Start & Environment Configuration

### LOCAL DEVELOPMENT (SQLite)
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure `.env`**:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="sk-proj-your-openai-api-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
   > *Note: If `OPENAI_API_KEY` is omitted or left empty, the application automatically uses the built-in **Deterministic Fallback Agent Engine**, executing all tools and policy rules flawlessly.*
3. **Database Setup & Seeding**:
   ```bash
   npx prisma generate
   npm run db:seed
   ```
4. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

### PRODUCTION DEPLOYMENT (Supabase PostgreSQL + Vercel)
1. **Supabase Environment Variables**:
   - `DATABASE_URL`: Transaction Pooler connection string (`port 6543`, e.g. `postgresql://USER:PASSWORD@TRANSACTION_POOLER_HOST:6543/postgres?pgbouncer=true`)
   - `DIRECT_URL`: Session Pooler connection string (`port 5432`, e.g. `postgresql://USER:PASSWORD@SESSION_POOLER_HOST:5432/postgres`)
   - `OPENAI_API_KEY`: OpenAI API Key
   - `NEXT_PUBLIC_APP_URL`: Production Vercel App URL
2. **Apply PostgreSQL Schema to Supabase**:
   ```bash
   npm run db:push:pg
   ```
3. **Seed Supabase PostgreSQL Database**:
   ```bash
   npm run db:seed
   ```
4. **Production Build Command**:
   ```bash
   npm run build:pg
   ```

---

## 🧪 Automated Testing & Verification

Run the full automated Vitest suite:
```bash
npm run test
```

### Verified Test Cases:
- `policyEngine.test.ts`:
  - `ORD-1001` (Valid) -> `APPROVE`
  - `ORD-1002` (Expired 45 days) -> `DENY (REFUND_WINDOW_EXCEEDED)`
  - `ORD-1003` (Already refunded) -> `DENY (ALREADY_REFUNDED)`
  - `ORD-1004` (Digital software) -> `DENY (NON_REFUNDABLE_CATEGORY)`
  - Ownership mismatch -> `DENY (CUSTOMER_MISMATCH)`
  - Non-existent order -> `DENY (ORDER_NOT_FOUND)`
- `agentTools.test.ts`: Backend tool logic & Zod schema validation.

---

## 🏗️ Production Build & Quality Control

Verify production build and TypeScript compilation:
```bash
npx tsc --noEmit
npm run lint
npm run build:pg
```

---

## ☁️ Deployment (Vercel Ready)

1. Push code to GitHub repository.
2. Import project in **Vercel**.
3. Configure Environment Variables in Vercel settings:
   - `DATABASE_URL` (Supabase Transaction Pooler URL, port 6543 with `?pgbouncer=true`)
   - `DIRECT_URL` (Supabase Session Pooler URL, port 5432)
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Override Vercel Build Command to: `npm run build:pg` (which runs `prisma generate --schema=prisma/schema.postgresql.prisma && next build`).
5. Deploy!

---

## 🎥 Demo Walkthrough Instructions (for Loom Video)

1. **Demo Case 1 (Valid Refund)**:
   - Select **Case 1: Valid Refund** in the Customer Refund Support UI.
   - Click **Send**.
   - Observe live step-by-step agent execution logs (`getCustomer` -> `getOrder` -> `validateRefundEligibility` -> `processRefundDecision`).
   - Final Result: **REFUND APPROVED ($149.99)**.

2. **Demo Case 2 (Expired Window)**:
   - Select **Case 2: Expired 30-Day Window**.
   - Click **Send**.
   - Final Result: **REFUND DENIED (Delivered 45 days ago, exceeds 30-day window)**.

3. **Admin Audit**:
   - Navigate to `/admin`.
   - View real-time request counters, approval percentages, and structured agent telemetry logs.
