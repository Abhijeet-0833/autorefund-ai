import { prisma } from "../db/prisma";
import type { OrderItem } from "@prisma/client";

export const REFUND_POLICY_CONFIG = {
  MAX_REFUND_DAYS: 30,
  NON_REFUNDABLE_CATEGORIES: [
    "Digital Download",
    "Gift Card",
    "Perishable",
    "Customized",
    "Digital Software",
    "Personalized",
  ],
};

export interface PolicyCheckDetails {
  orderExists: boolean;
  customerOwnsOrder: boolean;
  statusDelivered: boolean;
  within30DayWindow: boolean;
  daysSinceDelivery: number | null;
  notAlreadyRefunded: boolean;
  categoryEligible: boolean;
  nonRefundableItems: string[];
}

export interface PolicyValidationResult {
  eligible: boolean;
  decision: "APPROVE" | "DENY";
  reasonCode: string;
  explanation: string;
  orderId: string;
  customerId: string;
  calculatedAmount: number;
  checks: PolicyCheckDetails;
}

/**
 * Deterministically evaluates refund policy rules against backend CRM database.
 * The LLM NEVER makes this decision autonomously.
 */
export async function evaluateRefundPolicy(
  orderId: string,
  customerIdOrEmail: string,
  requestedAmount?: number
): Promise<PolicyValidationResult> {
  const normalizedOrderId = orderId.trim().toUpperCase();
  const normalizedCustomerQuery = customerIdOrEmail.trim().toLowerCase();

  // 1. Fetch Order with Customer & Items
  const order = await prisma.order.findUnique({
    where: { id: normalizedOrderId },
    include: {
      customer: true,
      items: true,
    },
  });

  const checks: PolicyCheckDetails = {
    orderExists: false,
    customerOwnsOrder: false,
    statusDelivered: false,
    within30DayWindow: false,
    daysSinceDelivery: null,
    notAlreadyRefunded: false,
    categoryEligible: true,
    nonRefundableItems: [],
  };

  // Rule 1: Order Existence
  if (!order) {
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "ORDER_NOT_FOUND",
      explanation: `Order ${normalizedOrderId} was not found in our database system.`,
      orderId: normalizedOrderId,
      customerId: customerIdOrEmail,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.orderExists = true;

  // Rule 2: Ownership Verification
  const isCustomerMatch =
    order.customerId.toLowerCase() === normalizedCustomerQuery ||
    order.customer.email.toLowerCase() === normalizedCustomerQuery ||
    order.customer.id.toLowerCase() === normalizedCustomerQuery;

  if (!isCustomerMatch) {
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "CUSTOMER_MISMATCH",
      explanation: `Order ${normalizedOrderId} does not belong to customer identity "${customerIdOrEmail}".`,
      orderId: normalizedOrderId,
      customerId: order.customerId,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.customerOwnsOrder = true;

  // Rule 3: Already Refunded Check
  if (order.isRefunded || order.status === "REFUNDED") {
    checks.notAlreadyRefunded = false;
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "ALREADY_REFUNDED",
      explanation: `Order ${normalizedOrderId} has already been fully refunded ($${order.refundedAmount.toFixed(
        2
      )} previously credited).`,
      orderId: normalizedOrderId,
      customerId: order.customerId,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.notAlreadyRefunded = true;

  // Rule 4: Delivery Status Check
  if (order.status !== "DELIVERED" || !order.deliveryDate) {
    checks.statusDelivered = false;
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "NOT_DELIVERED",
      explanation: `Order ${normalizedOrderId} has a status of "${order.status}" and has not been marked as delivered yet.`,
      orderId: normalizedOrderId,
      customerId: order.customerId,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.statusDelivered = true;

  // Rule 5: 30-Day Refund Window Check
  const now = new Date();
  const deliveryDate = new Date(order.deliveryDate);
  const diffTime = Math.abs(now.getTime() - deliveryDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  checks.daysSinceDelivery = diffDays;

  if (diffDays > REFUND_POLICY_CONFIG.MAX_REFUND_DAYS) {
    checks.within30DayWindow = false;
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "REFUND_WINDOW_EXCEEDED",
      explanation: `Order ${normalizedOrderId} was delivered ${diffDays} days ago, exceeding our strict 30-day refund window policy.`,
      orderId: normalizedOrderId,
      customerId: order.customerId,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.within30DayWindow = true;

  // Rule 6: Product Category Eligibility
  const items: OrderItem[] = order.items || [];
  const nonRefundable = items.filter(
    (item: OrderItem) =>
      !item.isRefundable ||
      REFUND_POLICY_CONFIG.NON_REFUNDABLE_CATEGORIES.some(
        (cat: string) => cat.toLowerCase() === (item.category || "").toLowerCase()
      )
  );

  if (nonRefundable.length > 0) {
    checks.categoryEligible = false;
    checks.nonRefundableItems = nonRefundable.map(
      (item: OrderItem) => `${item.productName} (${item.category})`
    );
    return {
      eligible: false,
      decision: "DENY",
      reasonCode: "NON_REFUNDABLE_CATEGORY",
      explanation: `Order ${normalizedOrderId} contains items in non-refundable categories: ${checks.nonRefundableItems.join(
        ", "
      )}.`,
      orderId: normalizedOrderId,
      customerId: order.customerId,
      calculatedAmount: 0,
      checks,
    };
  }
  checks.categoryEligible = true;

  // Calculate Refund Amount & Validate requested amount limit
  let finalAmount = order.totalAmount;
  if (requestedAmount && requestedAmount > 0) {
    if (requestedAmount > order.totalAmount) {
      return {
        eligible: false,
        decision: "DENY",
        reasonCode: "INVALID_REFUND_AMOUNT",
        explanation: `Requested refund amount ($${requestedAmount.toFixed(
          2
        )}) exceeds original order total ($${order.totalAmount.toFixed(2)}).`,
        orderId: normalizedOrderId,
        customerId: order.customerId,
        calculatedAmount: 0,
        checks,
      };
    }
    finalAmount = Number(requestedAmount.toFixed(2));
  }

  return {
    eligible: true,
    decision: "APPROVE",
    reasonCode: "ELIGIBLE",
    explanation: `Order ${normalizedOrderId} meets all policy requirements. Delivered ${diffDays} days ago, customer verified, product category eligible. Full refund of $${finalAmount.toFixed(
      2
    )} approved.`,
    orderId: normalizedOrderId,
    customerId: order.customerId,
    calculatedAmount: finalAmount,
    checks,
  };
}
