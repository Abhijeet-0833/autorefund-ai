import { z } from "zod";

export const ChatRequestSchema = z.object({
  customerId: z.string().min(1, "Customer ID or email is required"),
  orderId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty"),
  sessionId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const GetCustomerToolSchema = z.object({
  query: z.string().min(1, "Customer ID or email search query required"),
});

export const GetOrderToolSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
});

export const GetCustomerOrdersToolSchema = z.object({
  customerId: z.string().min(1, "Customer ID required"),
});

export const ValidateEligibilityToolSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  customerId: z.string().min(1, "Customer ID required"),
  reason: z.string().optional(),
  requestedAmount: z.number().optional(),
});

export const ProcessRefundToolSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  customerId: z.string().min(1, "Customer ID required"),
  decision: z.enum(["APPROVE", "DENY"]),
  amount: z.number().nonnegative(),
  reason: z.string().min(1, "Reason is required"),
});

export const LogAgentActionSchema = z.object({
  sessionOrRequestId: z.string().min(1),
  step: z.string().min(1),
  action: z.string().min(1),
  details: z.record(z.unknown()),
  status: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).default("INFO"),
});
