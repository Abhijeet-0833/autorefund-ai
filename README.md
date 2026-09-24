# AutoRefund AI — Customer Support Agent for E-Commerce Refund Processing

Production-ready Next.js 15 web application featuring an AI Customer Support Agent for E-Commerce Refund Processing with **deterministic server-side policy enforcement**.

---

## 🌟 Overview & Problem Statement

AutoRefund AI solves a critical challenge in autonomous AI agent architectures: **financial reliability, policy compliance, and auditability**. While OpenAI LLMs excel at natural language understanding and flexible tool selection, **the LLM is never the final authority on money approvals**. 

The deterministic policy engine is designed to enforce the defined refund rules independently of the LLM. All customer refund requests are strictly evaluated against server-side business rules (`lib/policy/refundPolicy.ts`) before any credit or database state change is committed.

---

## ✨ Features

- **🤖 Tool-Calling AI Agent Loop**: OpenAI function-orchestration loop dynamically querying CRM customer profiles, order history, and policy rules.
- **🛡️ Deterministic Backend Policy Engine**: Server-side policy engine that hard-enforces 30-day delivery limits, ownership, and product category exclusions regardless of LLM generation.
- **📊 15 Seeded CRM Customer Profiles**: Pre-populated database featuring realistic mock customers, multi-order histories, delivery dates, and product categories.
- **⚡ Real-Time Live Execution Logs**: Safe, structured audit logs capturing step-by-step agent tool calls, timestamps, parameters, and decision status.
- **🖥️ Admin Dashboard & Analytics**: Real-time management portal displaying total requests, approval rates, dollar totals, audit trails, and CRM customer records.
- **🚀 Dual-Mode Agent Runner**: Automatic fallback to a deterministic agent pipeline if `OPENAI_API_KEY` is missing or invalid, ensuring 100% test and demo reliability.
- **🧪 Automated Test Coverage**: Vitest suite verifying valid approvals, expired window denials, already refunded denials, digital category denials, and ownership mismatches.

---

## 🏗️ System Architecture

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
- **Database & ORM**: Prisma ORM 5.22.0 (SQLite for local dev/testing, Supabase PostgreSQL for production)
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

## 🔧 Agent & Tool Architecture

The agent interacts with the system using explicit Zod-validated tool definitions (`lib/tools/index.ts`):
- `getCustomer(query)`: Search customer records by email or ID.
- `getCustomerOrders(customerId)`: Fetch all orders owned by a customer.
- `getOrder(orderId)`: Fetch detailed order breakdown, delivery date, and refund status.
- `getRefundPolicy()`: Retrieve official refund policy rules.
- `validateRefundEligibility(orderId, customerId, reason, requestedAmount)`: Run deterministic policy checks.
- `calculateRefundAmount(orderId)`: Calculate maximum refundable amount.
- `processRefundDecision(orderId, customerId, decision, amount, reason)`: Execute decision and persist to database.

---

## 🗄️ Database Design

The database schema (`prisma/schema.postgresql.prisma`) includes 5 core models:
- **`Customer`**: Stores profile information (`id`, `name`, `email`, `phone`).
- **`Order`**: Tracks purchases (`id`, `purchaseDate`, `deliveryDate`, `totalAmount`, `status`, `isRefunded`, `refundedAmount`).
- **`OrderItem`**: Line items for orders (`productName`, `category`, `price`, `quantity`, `isRefundable`).
- **`RefundRequest`**: Audit records for every processed refund (`decision`, `approvedAmount`, `explanation`, `policyCheckResult`).
- **`AgentLog`**: Telemetry log entries capturing agent steps, actions, and status.

---

## 👥 15 Seeded CRM Customer Test Scenarios

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

## 🧪 Automated Testing

Run the full automated Vitest suite:
```bash
npm run test
```

### Verified Test Suite:
- `policyEngine.test.ts`:
  - `ORD-1001` (Valid) -> `APPROVE`
  - `ORD-1002` (Expired 45 days) -> `DENY (REFUND_WINDOW_EXCEEDED)`
  - `ORD-1003` (Already refunded) -> `DENY (ALREADY_REFUNDED)`
  - `ORD-1004` (Digital software) -> `DENY (NON_REFUNDABLE_CATEGORY)`
  - Ownership mismatch -> `DENY (CUSTOMER_MISMATCH)`
  - Non-existent order -> `DENY (ORDER_NOT_FOUND)`
- `agentTools.test.ts`: Backend tool logic & Zod schema validation.

---

## ☁️ Production Deployment (Vercel + Supabase)

1. **Environment Variables**:
   - `DATABASE_URL`: Supabase Transaction Pooler URL (`port 6543`)
   - `DIRECT_URL`: Supabase Session Pooler URL (`port 5432`)
   - `OPENAI_API_KEY`: OpenAI API key
   - `NEXT_PUBLIC_APP_URL`: Production application URL
2. **Build Script**: `npm run build` generates the PostgreSQL client via `prisma/schema.postgresql.prisma` and builds Next.js.

---

## 🔒 Security Considerations

- **Server-Side Re-Validation**: `processRefundDecision` re-executes the policy engine server-side, preventing LLM parameter manipulation.
- **No Secrets in Source/Logs**: Secrets are loaded exclusively via environment variables. Logs expose only sanitized event steps.
- **Strict Input Parsing**: All API endpoints and tools validate inputs using Zod.
- **Sanitized DB Connection URLs**: Runtime helper strips quotes/whitespace from database connection strings safely.

---

## 🛡️ Failure & Fallback Behavior

- **Deterministic Agent Fallback**: If `OPENAI_API_KEY` is omitted, missing, or encounters rate limits, the system seamlessly uses the built-in deterministic execution loop.
- **No Accidental Approvals**: Tool or database errors default to a safe `DENY` decision with clear user explanation.

---

## 🖼️ Screenshots Section

- **Customer Support Chat Interface**: Live interactive chat with demo preset selectors and policy verification breakdown badges.
- **Admin Audit Dashboard**: Metrics, approval stats, dollar totals, and database audit trail.
- **Structured Agent Telemetry Logs**: Real-time tool call inspection and step execution details.

---

## 🔗 Submission Links & Resources

- **Deployed Application URL**: `https://autorefund-ai.vercel.app` *(or your Vercel deployment link)*
- **Demo Video Walkthrough**: `[Loom / YouTube Demo Video Link Placeholder]`
- **GitHub Repository**: `https://github.com/Abhijeet-0833/autorefund-ai`
e to `/admin`.
   - View real-time request counters, approval percentages, and structured agent telemetry logs.
