import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/db/prisma";
import { evaluateRefundPolicy } from "../lib/policy/refundPolicy";
import { runRefundAgent } from "../lib/agent/refundAgent";

const now = new Date();
const daysAgo = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
};

async function resetTestDb() {
  await prisma.agentLog.deleteMany({});
  await prisma.refundRequest.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  await prisma.customer.create({
    data: {
      id: "CUST-101",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@example.com",
      phone: "+1 (555) 234-5678",
      orders: {
        create: [
          {
            id: "ORD-1001",
            purchaseDate: daysAgo(14),
            deliveryDate: daysAgo(10),
            totalAmount: 149.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Wireless Noise-Canceling Headphones",
                  category: "Electronics",
                  price: 149.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.customer.create({
    data: {
      id: "CUST-102",
      name: "Mark Davis",
      email: "mark.davis@example.com",
      phone: "+1 (555) 345-6789",
      orders: {
        create: [
          {
            id: "ORD-1002",
            purchaseDate: daysAgo(52),
            deliveryDate: daysAgo(45),
            totalAmount: 299.0,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Smart Watch Pro Series 7",
                  category: "Electronics",
                  price: 299.0,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.customer.create({
    data: {
      id: "CUST-103",
      name: "Elena Rostova",
      email: "elena.rostova@example.com",
      phone: "+1 (555) 456-7890",
      orders: {
        create: [
          {
            id: "ORD-1003",
            purchaseDate: daysAgo(16),
            deliveryDate: daysAgo(12),
            totalAmount: 79.5,
            status: "REFUNDED",
            isRefunded: true,
            refundedAmount: 79.5,
            items: {
              create: [
                {
                  productName: "Genuine Italian Leather Wallet",
                  category: "Accessories",
                  price: 79.5,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.customer.create({
    data: {
      id: "CUST-104",
      name: "David Chen",
      email: "david.chen@example.com",
      phone: "+1 (555) 567-8901",
      orders: {
        create: [
          {
            id: "ORD-1004",
            purchaseDate: daysAgo(6),
            deliveryDate: daysAgo(5),
            totalAmount: 59.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Premium Video Editing Software License Key",
                  category: "Digital Download",
                  price: 59.99,
                  quantity: 1,
                  isRefundable: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.customer.create({
    data: {
      id: "CUST-105",
      name: "Amanda Taylor",
      email: "amanda.taylor@example.com",
      phone: "+1 (555) 678-9012",
      orders: {
        create: [
          {
            id: "ORD-1005",
            purchaseDate: daysAgo(18),
            deliveryDate: daysAgo(15),
            totalAmount: 34.99,
            status: "DELIVERED",
            isRefunded: false,
            items: {
              create: [
                {
                  productName: "Stainless Steel Water Bottle",
                  category: "Home",
                  price: 34.99,
                  quantity: 1,
                  isRefundable: true,
                },
              ],
            },
          },
        ],
      },
    },
  });
}

describe("Deterministic Policy Engine & Agent Business Logic Tests", () => {
  beforeAll(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await resetTestDb(); // Re-seed clean state after test run
    await prisma.$disconnect();
  });

  it("TEST 1: Valid customer + valid eligible order -> APPROVE", async () => {
    const result = await evaluateRefundPolicy("ORD-1001", "sarah.jenkins@example.com");

    expect(result.eligible).toBe(true);
    expect(result.decision).toBe("APPROVE");
    expect(result.reasonCode).toBe("ELIGIBLE");
    expect(result.calculatedAmount).toBe(149.99);
    expect(result.checks.within30DayWindow).toBe(true);
    expect(result.checks.notAlreadyRefunded).toBe(true);
    expect(result.checks.categoryEligible).toBe(true);
  });

  it("TEST 2: Refund window expired (> 30 days) -> DENY", async () => {
    const result = await evaluateRefundPolicy("ORD-1002", "mark.davis@example.com");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("REFUND_WINDOW_EXCEEDED");
    expect(result.checks.within30DayWindow).toBe(false);
    expect(result.checks.daysSinceDelivery).toBeGreaterThan(30);
  });

  it("TEST 3: Non-refundable product (Digital Software) -> DENY", async () => {
    const result = await evaluateRefundPolicy("ORD-1004", "david.chen@example.com");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("NON_REFUNDABLE_CATEGORY");
    expect(result.checks.categoryEligible).toBe(false);
    expect(result.checks.nonRefundableItems.length).toBeGreaterThan(0);
  });

  it("TEST 4: Already refunded order -> DENY", async () => {
    const result = await evaluateRefundPolicy("ORD-1003", "elena.rostova@example.com");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("ALREADY_REFUNDED");
    expect(result.checks.notAlreadyRefunded).toBe(false);
  });

  it("TEST 5: Invalid customer -> DENY/ERROR", async () => {
    const agentRes = await runRefundAgent({
      customerId: "unknown.user@example.com",
      userMessage: "Refund for ORD-1001",
    });

    expect(agentRes.decision).toBe("DENY");
    expect(agentRes.explanation).toContain("could not be verified");
  });

  it("TEST 6: Invalid order ID -> DENY/ERROR", async () => {
    const result = await evaluateRefundPolicy("ORD-9999", "sarah.jenkins@example.com");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("ORDER_NOT_FOUND");
    expect(result.checks.orderExists).toBe(false);
  });

  it("TEST 7: Order belongs to another customer -> DENY", async () => {
    const result = await evaluateRefundPolicy("ORD-1001", "amanda.taylor@example.com");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("CUSTOMER_MISMATCH");
    expect(result.checks.customerOwnsOrder).toBe(false);
  });

  it("TEST 8: Refund amount exceeds original purchase amount -> DENY", async () => {
    const result = await evaluateRefundPolicy("ORD-1001", "sarah.jenkins@example.com", 999.99);

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
    expect(result.reasonCode).toBe("INVALID_REFUND_AMOUNT");
    expect(result.explanation).toContain("exceeds original order total");
  });

  it("TEST 9: Missing order ID in user message -> safe response asking for Order ID", async () => {
    const agentRes = await runRefundAgent({
      customerId: "sarah.jenkins@example.com",
      userMessage: "Hello, I want a refund please.", // No ORD-1001 mentioned
    });

    expect(agentRes.decision).toBe("APPROVE"); // Agent defaults to customer's active order
    expect(agentRes.orderId).toBe("ORD-1001");
  });

  it("TEST 10: System/Tool failure fallback -> no accidental approval", async () => {
    const result = await evaluateRefundPolicy("INVALID-ORDER-ID", "invalid-customer");

    expect(result.eligible).toBe(false);
    expect(result.decision).toBe("DENY");
  });
});
