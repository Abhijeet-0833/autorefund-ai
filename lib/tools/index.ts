import { prisma } from "../db/prisma";
import { evaluateRefundPolicy, REFUND_POLICY_CONFIG } from "../policy/refundPolicy";
import {
  GetCustomerToolSchema,
  GetCustomerOrdersToolSchema,
  GetOrderToolSchema,
  ValidateEligibilityToolSchema,
  ProcessRefundToolSchema,
  LogAgentActionSchema,
} from "../validation/schemas";

export async function toolGetCustomer(query: string) {
  const parsed = GetCustomerToolSchema.parse({ query });
  const normalized = parsed.query.trim();

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { id: { equals: normalized } },
        { email: { equals: normalized } },
        { id: { contains: normalized } },
        { email: { contains: normalized } },
      ],
    },
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          purchaseDate: true,
          deliveryDate: true,
          isRefunded: true,
        },
      },
    },
  });

  if (!customer) {
    return { success: false, error: `No customer found matching "${query}"` };
  }

  return {
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      orderCount: customer.orders.length,
      orders: customer.orders,
    },
  };
}

export async function toolGetCustomerOrders(customerId: string) {
  const parsed = GetCustomerOrdersToolSchema.parse({ customerId });

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: parsed.customerId },
        { customer: { email: parsed.customerId } },
      ],
    },
    include: {
      items: true,
    },
    orderBy: { purchaseDate: "desc" },
  });

  return {
    success: true,
    customerId: parsed.customerId,
    orderCount: orders.length,
    orders: orders.map((o) => ({
      id: o.id,
      purchaseDate: o.purchaseDate,
      deliveryDate: o.deliveryDate,
      totalAmount: o.totalAmount,
      status: o.status,
      isRefunded: o.isRefunded,
      refundedAmount: o.refundedAmount,
      items: o.items,
    })),
  };
}

export async function toolGetOrder(orderId: string) {
  const parsed = GetOrderToolSchema.parse({ orderId });
  const normalizedId = parsed.orderId.trim().toUpperCase();

  const order = await prisma.order.findUnique({
    where: { id: normalizedId },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      items: true,
    },
  });

  if (!order) {
    return { success: false, error: `Order "${normalizedId}" not found in CRM database.` };
  }

  return {
    success: true,
    order: {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      purchaseDate: order.purchaseDate,
      deliveryDate: order.deliveryDate,
      totalAmount: order.totalAmount,
      status: order.status,
      isRefunded: order.isRefunded,
      refundedAmount: order.refundedAmount,
      items: order.items,
    },
  };
}

export async function toolGetRefundPolicy() {
  return {
    success: true,
    policy: {
      maxRefundDaysFromDelivery: REFUND_POLICY_CONFIG.MAX_REFUND_DAYS,
      nonRefundableProductCategories: REFUND_POLICY_CONFIG.NON_REFUNDABLE_CATEGORIES,
      rules: [
        "1. Refund requests must be made within 30 days of delivery date.",
        "2. Order must exist in CRM system.",
        "3. Customer must be the verified owner of the order.",
        "4. Order status must be DELIVERED.",
        "5. Order must not already be marked as REFUNDED.",
        "6. Items in categories (Digital Download, Gift Card, Perishable, Customized, Personalized) are strictly non-refundable.",
        "7. Refund amount cannot exceed original purchase total.",
        "8. Invalid or missing information results in automatic denial.",
      ],
    },
  };
}

export async function toolValidateRefundEligibility(
  orderId: string,
  customerId: string,
  reason?: string,
  requestedAmount?: number
) {
  const parsed = ValidateEligibilityToolSchema.parse({ orderId, customerId, reason, requestedAmount });
  const evaluation = await evaluateRefundPolicy(parsed.orderId, parsed.customerId, parsed.requestedAmount);

  return {
    success: true,
    evaluation,
  };
}

export async function toolCalculateRefundAmount(orderId: string) {
  const parsed = GetOrderToolSchema.parse({ orderId });
  const orderRes = await toolGetOrder(parsed.orderId);

  if (!orderRes.success || !orderRes.order) {
    return { success: false, error: orderRes.error };
  }

  const order = orderRes.order;
  if (order.isRefunded) {
    return { success: true, maxRefundableAmount: 0, reason: "Order is already refunded" };
  }

  const refundableAmount = Math.max(0, order.totalAmount - order.refundedAmount);
  return {
    success: true,
    orderId: order.id,
    totalAmount: order.totalAmount,
    alreadyRefundedAmount: order.refundedAmount,
    maxRefundableAmount: Number(refundableAmount.toFixed(2)),
  };
}

export async function toolProcessRefundDecision(
  orderId: string,
  customerId: string,
  decision: "APPROVE" | "DENY",
  amount: number,
  reason: string
) {
  const parsed = ProcessRefundToolSchema.parse({ orderId, customerId, decision, amount, reason });

  // MANDATORY SECURITY GUARANTEE:
  // Re-evaluate deterministically server-side! Never trust raw parameters from LLM!
  const deterministicEval = await evaluateRefundPolicy(parsed.orderId, parsed.customerId, parsed.amount);

  let finalDecision = parsed.decision;
  let finalAmount = parsed.amount;
  let finalExplanation = parsed.reason;

  // Enforce server-side policy validation result
  if (!deterministicEval.eligible) {
    finalDecision = "DENY";
    finalAmount = 0;
    finalExplanation = `Refund denied: ${deterministicEval.explanation}`;
  } else {
    finalDecision = "APPROVE";
    finalAmount = deterministicEval.calculatedAmount;
    finalExplanation = deterministicEval.explanation;
  }

  // Create database RefundRequest entry
  const refundReq = await prisma.refundRequest.create({
    data: {
      customerId: deterministicEval.customerId || parsed.customerId,
      orderId: parsed.orderId.trim().toUpperCase(),
      requestReason: parsed.reason,
      requestedAmount: parsed.amount,
      decision: finalDecision,
      approvedAmount: finalAmount,
      explanation: finalExplanation,
      policyCheckResult: JSON.stringify(deterministicEval),
    },
  });

  // If approved, update order status in CRM
  if (finalDecision === "APPROVE") {
    await prisma.order.update({
      where: { id: parsed.orderId.trim().toUpperCase() },
      data: {
        isRefunded: true,
        status: "REFUNDED",
        refundedAmount: finalAmount,
      },
    });
  }

  return {
    success: true,
    refundRequestId: refundReq.id,
    decision: finalDecision,
    approvedAmount: finalAmount,
    explanation: finalExplanation,
    policyResult: deterministicEval,
  };
}

export async function toolLogAgentAction(
  sessionOrRequestId: string,
  step: string,
  action: string,
  details: Record<string, unknown>,
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO"
) {
  const parsed = LogAgentActionSchema.parse({ sessionOrRequestId, step, action, details, status });

  const log = await prisma.agentLog.create({
    data: {
      refundRequestId: parsed.sessionOrRequestId.startsWith("cl") ? parsed.sessionOrRequestId : null,
      step: parsed.step,
      action: parsed.action,
      details: JSON.stringify(parsed.details),
      status: parsed.status,
    },
  });

  return { success: true, logId: log.id };
}

/**
 * Registry of tool definitions for OpenAI tool calling
 */
export const openAIToolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "getCustomer",
      description: "Retrieve customer details and order summary by customer email or customer ID.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Customer email address or customer ID (e.g. sarah.jenkins@example.com or CUST-101)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCustomerOrders",
      description: "Fetch all past and present orders for a specific customer.",
      parameters: {
        type: "object",
        properties: {
          customerId: { type: "string", description: "Customer ID or customer email" },
        },
        required: ["customerId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getOrder",
      description: "Get detailed order information including line items, delivery date, total price, and current refund status.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID (e.g., ORD-1001)" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getRefundPolicy",
      description: "Retrieve the official store refund policy document and rules.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "validateRefundEligibility",
      description: "Run deterministic policy checks on an order to determine if it is eligible for a refund.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID (e.g. ORD-1001)" },
          customerId: { type: "string", description: "Customer ID or email requesting refund" },
          reason: { type: "string", description: "Customer's reason for requesting refund" },
          requestedAmount: { type: "number", description: "Specific dollar amount requested for refund if specified" },
        },
        required: ["orderId", "customerId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculateRefundAmount",
      description: "Calculate the exact maximum refundable amount for an order.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID (e.g. ORD-1001)" },
        },
        required: ["orderId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "processRefundDecision",
      description: "Execute the final APPROVE or DENY refund decision. Submits decision to backend database.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "Order ID" },
          customerId: { type: "string", description: "Customer ID or email" },
          decision: { type: "string", enum: ["APPROVE", "DENY"], description: "Decision to approve or deny" },
          amount: { type: "number", description: "Dollar amount to refund" },
          reason: { type: "string", description: "Clear explanation for decision" },
        },
        required: ["orderId", "customerId", "decision", "amount", "reason"],
      },
    },
  },
];
