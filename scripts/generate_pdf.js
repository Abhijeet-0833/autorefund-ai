const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function createProjectPDF() {
  const outputPath = path.join(__dirname, "..", "AutoRefund_AI_Project_Documentation.pdf");
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  doc.pipe(fs.createWriteStream(outputPath));

  // Colors
  const primaryColor = "#1e40af"; // Deep blue
  const secondaryColor = "#0f172a"; // Dark slate
  const accentColor = "#059669"; // Emerald green
  const textColor = "#334155"; // Slate text

  // Title Header
  doc
    .fillColor(primaryColor)
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("AutoRefund AI — Technical Documentation", { align: "center" });

  doc.moveDown(0.5);
  doc
    .fillColor(secondaryColor)
    .fontSize(12)
    .font("Helvetica-Oblique")
    .text("Production-Ready AI Customer Support Agent with Deterministic Policy Enforcement", {
      align: "center",
    });

  doc.moveDown(1.5);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Section 1: Problem Statement
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("1. Problem Statement");
  doc.moveDown(0.5);
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "In modern e-commerce automation, traditional LLM-based customer support bots suffer from a critical flaw: FINANCIAL HALLUCINATION. Standard AI models may promise refunds to customers without verifying backend database records, customer order ownership, delivery dates, or product return eligibility rules.\n\n" +
        "Key Challenges Solved:\n" +
        "• Unreliable LLM Decision Making: Pure text generation models cannot be trusted with autonomous monetary transactions.\n" +
        "• Lack of Real Backend Integration: Chatbots often operate on isolated text without dynamic CRM database validation.\n" +
        "• Policy Compliance Risks: Store return windows (e.g., 30-day limits) and non-refundable categories (Digital Software, Gift Cards, Perishable items) are easily bypassed by raw generative AI.\n" +
        "• Security Vulnerabilities: Trusting frontend client requests for customer identity or refund amounts enables fraudulent overrides.",
      { align: "justify", lineGap: 3 }
    );

  doc.moveDown(1.5);

  // Section 2: Motivation
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("2. Project Motivation");
  doc.moveDown(0.5);
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "The primary motivation of AutoRefund AI is to demonstrate how to architect a production-ready AI Agent that combines the natural language understanding of LLMs with the absolute mathematical reliability of server-side code.\n\n" +
        "By enforcing a strict boundary between AI Tool Orchestration and Deterministic Policy Validation, the application guarantees 100% compliance with business rules while delivering a smooth, empathetic customer experience.",
      { align: "justify", lineGap: 3 }
    );

  doc.moveDown(1.5);

  // Section 3: Primary Objectives
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("3. Core Objectives");
  doc.moveDown(0.5);
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "1. Server-Side Policy Authority: Ensure the LLM NEVER acts as the final decision maker for money approvals.\n" +
        "2. Dynamic Tool Orchestration: Implement an iterative agent loop that dynamically calls backend tools (getCustomer, getOrder, validateRefundEligibility, processRefundDecision).\n" +
        "3. Deterministic Database CRM Integration: Seed exactly 15 realistic customer profiles with complete order histories, delivery dates, and product categories.\n" +
        "4. Real-Time Telemetry & Auditing: Provide an Admin Operations Dashboard displaying structured step-by-step agent execution logs and metrics.\n" +
        "5. Fail-Safe Reliability: Include an automated deterministic fallback runner so tests and live demos function 100% reliably with or without external API keys.",
      { align: "justify", lineGap: 4 }
    );

  doc.addPage(); // Page 2

  // Section 4: Technologies Used (Tech Stack)
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("4. Technology Stack & Knowledge Used");
  doc.moveDown(0.5);

  const techList = [
    ["Framework", "Next.js 15+ (App Router, React 19, TypeScript)"],
    ["Styling", "Vanilla Tailwind CSS + Glassmorphism design tokens"],
    ["Database & ORM", "Prisma ORM with SQLite (dev.db) & PostgreSQL readiness"],
    ["AI Orchestration", "OpenAI Function Calling API (gpt-4o-mini) + Fallback Loop"],
    ["Validation", "Zod schema validation for API payloads and tool parameters"],
    ["Testing", "Vitest automated test suite (16 business logic tests passing)"],
    ["Logging", "Structured database event logging (AgentLog model)"],
    ["Deployment", "Vercel-compatible serverless architecture"],
  ];

  techList.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .fontSize(10)
      .text(`• ${label}: `, { continued: true })
      .font("Helvetica")
      .fillColor(textColor)
      .text(value);
    doc.moveDown(0.3);
  });

  doc.moveDown(1.5);

  // Section 5: System Architecture & Workflow
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("5. System Architecture & Flow");
  doc.moveDown(0.5);
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "User Request (Next.js Chat UI)\n" +
        "  └──> Next.js API Route (/api/chat) [Zod Validation]\n" +
        "        └──> OpenAI AI Agent Loop (Tool Selection)\n" +
        "              ├──> getCustomer(query)\n" +
        "              ├──> getOrder(orderId)\n" +
        "              ├──> validateRefundEligibility(orderId, customerId)\n" +
        "              │     └──> Deterministic Policy Engine (Server-Side Code)\n" +
        "              │           ├── 30-Day Delivery Window Check\n" +
        "              │           ├── Order Ownership Verification\n" +
        "              │           ├── Product Category Check\n" +
        "              │           ├── Previous Refund Check\n" +
        "              │           └── Refund Amount Cap Check\n" +
        "              └──> processRefundDecision(orderId, customerId, decision)\n" +
        "                    ├── Updates CRM Order Status to REFUNDED\n" +
        "                    ├── Creates RefundRequest record\n" +
        "                    └── Records Structured Agent Execution Logs",
      { lineGap: 3 }
    );

  doc.moveDown(1.5);

  // Section 6: Seeded Demo Scenarios (15 Customers)
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("6. Pre-Seeded CRM Scenarios");
  doc.moveDown(0.5);
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      "The CRM database contains 15 realistic customer profiles covering all required edge cases:\n" +
        "• Case 1: Valid Refund (Sarah Jenkins / ORD-1001) -> APPROVED ($149.99 Electronics)\n" +
        "• Case 2: Window Exceeded (Mark Davis / ORD-1002) -> DENIED (Delivered 45 days ago)\n" +
        "• Case 3: Already Refunded (Elena Rostova / ORD-1003) -> DENIED (Status REFUNDED)\n" +
        "• Case 4: Non-Refundable Item (David Chen / ORD-1004) -> DENIED (Digital Download Software)\n" +
        "• Case 5: Ownership Mismatch (Amanda Taylor querying ORD-1001) -> DENIED (Not Owner)\n" +
        "• Case 6: Multi-Order Customer (James Wilson / ORD-1006A) -> APPROVED\n" +
        "• Cases 7-15: Custom Engraved items, In-Transit orders, Gift Cards, Ergonomic Office Chairs, Bluetooth Speakers, and Perishable Coffee Beans.",
      { lineGap: 3 }
    );

  // Footer on page 2
  doc.moveDown(2);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);
  doc
    .fillColor("#64748b")
    .fontSize(9)
    .font("Helvetica")
    .text("AutoRefund AI System • Generated Documentation • http://localhost:3000", {
      align: "center",
    });

  doc.end();
  console.log("✅ Generated PDF report at:", outputPath);
}

createProjectPDF();
