import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../lib/db/prisma";
import {
  toolGetCustomer,
  toolGetOrder,
  toolGetCustomerOrders,
  toolGetRefundPolicy,
  toolCalculateRefundAmount,
} from "../lib/tools";
import { ChatRequestSchema, ProcessRefundToolSchema } from "../lib/validation/schemas";

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
}

describe("Backend Agent Tools & Validation Tests", () => {
  beforeAll(async () => {
    await resetTestDb();
  });

  it("toolGetCustomer should find seeded customer Sarah Jenkins by email", async () => {
    const res = await toolGetCustomer("sarah.jenkins@example.com");
    expect(res.success).toBe(true);
    expect(res.customer?.name).toBe("Sarah Jenkins");
  });

  it("toolGetOrder should fetch order details for ORD-1001", async () => {
    const res = await toolGetOrder("ORD-1001");
    expect(res.success).toBe(true);
    expect(res.order?.id).toBe("ORD-1001");
    expect(res.order?.totalAmount).toBe(149.99);
  });

  it("toolGetRefundPolicy should return policy rules", async () => {
    const res = await toolGetRefundPolicy();
    expect(res.success).toBe(true);
    expect(res.policy.maxRefundDaysFromDelivery).toBe(30);
    expect(res.policy.rules.length).toBeGreaterThan(0);
  });

  it("toolCalculateRefundAmount should calculate max refundable total", async () => {
    const res = await toolCalculateRefundAmount("ORD-1001");
    expect(res.success).toBe(true);
    expect(res.maxRefundableAmount).toBe(149.99);
  });

  it("Zod ChatRequestSchema should validate valid input and reject empty message", () => {
    const valid = ChatRequestSchema.safeParse({
      customerId: "sarah.jenkins@example.com",
      orderId: "ORD-1001",
      message: "I want a refund",
    });
    expect(valid.success).toBe(true);

    const invalid = ChatRequestSchema.safeParse({
      customerId: "",
      message: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("Zod ProcessRefundToolSchema should reject negative refund amount", () => {
    const invalid = ProcessRefundToolSchema.safeParse({
      orderId: "ORD-1001",
      customerId: "CUST-101",
      decision: "APPROVE",
      amount: -50,
      reason: "Invalid amount",
    });
    expect(invalid.success).toBe(false);
  });
});
