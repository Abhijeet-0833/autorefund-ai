import OpenAI from "openai";
import {
  openAIToolDefinitions,
  toolGetCustomer,
  toolGetCustomerOrders,
  toolGetOrder,
  toolGetRefundPolicy,
  toolValidateRefundEligibility,
  toolCalculateRefundAmount,
  toolProcessRefundDecision,
  toolLogAgentAction,
} from "../tools";
import { evaluateRefundPolicy, PolicyCheckDetails } from "../policy/refundPolicy";

export interface AgentExecutionStepLog {
  step: string;
  action: string;
  timestamp: string;
  status: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  details: Record<string, unknown>;
}

export interface AgentRunResult {
  success: boolean;
  decision: "APPROVE" | "DENY" | "PENDING";
  explanation: string;
  approvedAmount: number;
  orderId: string | null;
  customerId: string;
  logs: AgentExecutionStepLog[];
  toolCallsExecuted: string[];
  executionTimeMs: number;
  checks?: PolicyCheckDetails;
}

export const SYSTEM_PROMPT = `
You are an expert, empathetic, and compliant AI Customer Support Agent for an e-commerce platform.
Your primary role is to process customer refund requests accurately and securely according to official store policies.

STRICT AGENT RULES:
1. You MUST always retrieve customer details using 'getCustomer' or 'getCustomerOrders'.
2. You MUST check order details using 'getOrder'.
3. You MUST check policy eligibility using 'validateRefundEligibility'.
4. You MUST NEVER guess or assume refund eligibility or ownership. Always use tool outputs.
5. You MUST execute 'processRefundDecision' to finalize the refund decision in the database.
6. The backend policy engine has final authority. If 'validateRefundEligibility' returns DENY, your final decision MUST be DENY.
7. Be polite, professional, and clear in explaining the outcome to the customer.
`;

/**
 * Main agent entrypoint orchestrating tool calls & policy evaluation.
 */
export async function runRefundAgent(params: {
  customerId: string;
  userMessage: string;
  orderIdHint?: string;
}): Promise<AgentRunResult> {
  const startTime = Date.now();
  const logs: AgentExecutionStepLog[] = [];
  const toolCallsExecuted: string[] = [];

  const addLog = (
    step: string,
    action: string,
    details: Record<string, unknown>,
    status: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO"
  ) => {
    const entry: AgentExecutionStepLog = {
      step,
      action,
      timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      details,
      status,
    };
    logs.push(entry);
    toolLogAgentAction("session-run", step, action, details, status).catch(() => {});
  };

  addLog("Step 1: Initialization", "Received refund request", {
    customerId: params.customerId,
    userMessage: params.userMessage,
    orderIdHint: params.orderIdHint || "Extracting from message...",
  });

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // If OpenAI API key is missing or invalid placeholder, run the deterministic agent loop
  if (!apiKey || apiKey === "sk-proj-your-openai-api-key" || apiKey.length < 20) {
    addLog(
      "Step 2: Engine Mode",
      "Using Deterministic Agent Loop (OpenAI API key omitted/placeholder)",
      { mode: "Deterministic Fallback Agent" }
    );
    return runDeterministicAgentLoop(params, startTime, logs, toolCallsExecuted, addLog);
  }

  // Real OpenAI Function Calling Loop
  try {
    const openai = new OpenAI({ apiKey });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Customer Identity: ${params.customerId}\n${
          params.orderIdHint ? `Order ID: ${params.orderIdHint}\n` : ""
        }Request: ${params.userMessage}`,
      },
    ];

    let stepCount = 0;
    const maxSteps = 8;
    let finalDecision: "APPROVE" | "DENY" | "PENDING" = "PENDING";
    let finalExplanation = "";
    let approvedAmount = 0;
    let resolvedOrderId: string | null = params.orderIdHint || null;

    while (stepCount < maxSteps) {
      stepCount++;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools: openAIToolDefinitions,
        tool_choice: "auto",
        temperature: 0.1,
      });

      const responseMessage = response.choices[0].message;
      messages.push(responseMessage);

      // If LLM returned text without tool calls, we break
      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalExplanation = responseMessage.content || "Request processed.";
        break;
      }

      // Execute tool calls sequentially
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        toolCallsExecuted.push(functionName);
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        addLog(`Step ${stepCount + 2}: Tool Call`, `Executing dynamic tool: ${functionName}`, {
          tool: functionName,
          arguments: args,
        });

        let toolResult: unknown;

        switch (functionName) {
          case "getCustomer": {
            const queryStr = typeof args.query === "string" ? args.query : params.customerId;
            const custResult = await toolGetCustomer(queryStr);
            toolResult = custResult;
            addLog("Customer Identity", "Customer identified", {
              found: custResult.success,
              customerName: custResult.customer ? custResult.customer.name : null,
            }, custResult.success ? "SUCCESS" : "ERROR");
            break;
          }

          case "getCustomerOrders": {
            const custId = typeof args.customerId === "string" ? args.customerId : params.customerId;
            const ordersResult = await toolGetCustomerOrders(custId);
            toolResult = ordersResult;
            addLog("Order History", "Customer orders retrieved", {
              orderCount: ordersResult.orderCount,
            }, "SUCCESS");
            break;
          }

          case "getOrder": {
            const orderIdStr = typeof args.orderId === "string" ? args.orderId : (params.orderIdHint || "");
            const orderResult = await toolGetOrder(orderIdStr);
            if (orderResult.success && orderResult.order) {
              resolvedOrderId = orderResult.order.id;
            }
            toolResult = orderResult;
            addLog("Order Retrieval", `Order #${orderIdStr} retrieved`, {
              found: orderResult.success,
              status: orderResult.order?.status,
              amount: orderResult.order?.totalAmount,
            }, orderResult.success ? "SUCCESS" : "ERROR");
            break;
          }

          case "getRefundPolicy": {
            const policyResult = await toolGetRefundPolicy();
            toolResult = policyResult;
            addLog("Refund Policy", "Refund policy retrieved", {
              maxDays: policyResult.policy.maxRefundDaysFromDelivery,
            }, "SUCCESS");
            break;
          }

          case "validateRefundEligibility": {
            const orderIdStr = typeof args.orderId === "string" ? args.orderId : (params.orderIdHint || "");
            const custId = typeof args.customerId === "string" ? args.customerId : params.customerId;
            const reasonStr = typeof args.reason === "string" ? args.reason : undefined;
            const reqAmt = typeof args.requestedAmount === "number" ? args.requestedAmount : undefined;

            const evalResult = await toolValidateRefundEligibility(
              orderIdStr,
              custId,
              reasonStr,
              reqAmt
            );
            toolResult = evalResult;
            resolvedOrderId = orderIdStr;
            addLog("Policy Engine", evalResult.evaluation.eligible ? "Policy validation passed" : `Policy validation failed: ${evalResult.evaluation.reasonCode}`, {
              decision: evalResult.evaluation.decision,
              reasonCode: evalResult.evaluation.reasonCode,
              explanation: evalResult.evaluation.explanation,
              checks: evalResult.evaluation.checks,
            }, evalResult.evaluation.eligible ? "SUCCESS" : "WARNING");
            break;
          }

          case "calculateRefundAmount": {
            const orderIdStr = typeof args.orderId === "string" ? args.orderId : (params.orderIdHint || "");
            const calcResult = await toolCalculateRefundAmount(orderIdStr);
            toolResult = calcResult;
            addLog("Amount Calculation", `Refund amount calculated: $${calcResult.maxRefundableAmount}`, {
              amount: calcResult.maxRefundableAmount,
            }, "SUCCESS");
            break;
          }

          case "processRefundDecision": {
            const orderIdStr = typeof args.orderId === "string" ? args.orderId : (params.orderIdHint || "");
            const custId = typeof args.customerId === "string" ? args.customerId : params.customerId;
            const decisionVal = args.decision === "APPROVE" || args.decision === "DENY" ? args.decision : "DENY";
            const amountVal = typeof args.amount === "number" ? args.amount : 0;
            const reasonStr = typeof args.reason === "string" ? args.reason : "Refund processed";

            const procResult = await toolProcessRefundDecision(
              orderIdStr,
              custId,
              decisionVal,
              amountVal,
              reasonStr
            );
            toolResult = procResult;
            resolvedOrderId = orderIdStr;
            finalDecision = procResult.decision;
            approvedAmount = procResult.approvedAmount;
            finalExplanation = procResult.explanation;
            addLog("Final Execution", `Decision: ${procResult.decision}`, {
              decision: procResult.decision,
              approvedAmount: procResult.approvedAmount,
              refundRequestId: procResult.refundRequestId,
            }, procResult.decision === "APPROVE" ? "SUCCESS" : "ERROR");
            break;
          }

          default:
            toolResult = { error: `Unknown tool name: ${functionName}` };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    // Ensure a decision was recorded if step loop finished
    if (finalDecision === "PENDING" && resolvedOrderId) {
      const evalRes = await evaluateRefundPolicy(resolvedOrderId, params.customerId);
      const processRes = await toolProcessRefundDecision(
        resolvedOrderId,
        params.customerId,
        evalRes.decision,
        evalRes.calculatedAmount,
        evalRes.explanation
      );
      finalDecision = processRes.decision;
      approvedAmount = processRes.approvedAmount;
      finalExplanation = processRes.explanation;
    }

    const executionTimeMs = Date.now() - startTime;
    return {
      success: true,
      decision: finalDecision,
      explanation: finalExplanation || "Refund processing complete.",
      approvedAmount,
      orderId: resolvedOrderId,
      customerId: params.customerId,
      logs,
      toolCallsExecuted,
      executionTimeMs,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    addLog("Agent Failure", "Error during OpenAI agent execution; falling back safely", {
      error: errorMessage,
    }, "ERROR");

    // Fallback safely to deterministic execution
    return runDeterministicAgentLoop(params, startTime, logs, toolCallsExecuted, addLog);
  }
}

/**
 * Deterministic agent loop that executes the exact tool pipeline reliably.
 */
async function runDeterministicAgentLoop(
  params: { customerId: string; userMessage: string; orderIdHint?: string },
  startTime: number,
  logs: AgentExecutionStepLog[],
  toolCallsExecuted: string[],
  addLog: (step: string, action: string, details: Record<string, unknown>, status?: "INFO" | "SUCCESS" | "WARNING" | "ERROR") => void
): Promise<AgentRunResult> {
  // Step A: Extract Order ID from hint or message regex (e.g. ORD-1001)
  let extractedOrderId = params.orderIdHint;
  if (!extractedOrderId) {
    const match = params.userMessage.match(/ORD-\d+[A-Z]?/i);
    if (match) {
      extractedOrderId = match[0].toUpperCase();
    }
  }

  // Tool 1: getCustomer
  toolCallsExecuted.push("getCustomer");
  const custRes = await toolGetCustomer(params.customerId);
  addLog("Step 2: Customer Identity", "Customer identified", {
    queried: params.customerId,
    found: custRes.success,
    customerName: custRes.customer?.name,
  }, custRes.success ? "SUCCESS" : "ERROR");

  if (!custRes.success || !custRes.customer) {
    addLog("Step 3: Verification Failed", "Customer identity not found", { query: params.customerId }, "ERROR");
    return {
      success: false,
      decision: "DENY",
      explanation: `Customer "${params.customerId}" could not be verified in our records.`,
      approvedAmount: 0,
      orderId: extractedOrderId || null,
      customerId: params.customerId,
      logs,
      toolCallsExecuted,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Tool 2: Order lookup
  if (!extractedOrderId && custRes.customer.orders.length > 0) {
    extractedOrderId = custRes.customer.orders[0].id;
  }

  if (!extractedOrderId) {
    addLog("Step 3: Missing Order ID", "Order ID required", {}, "ERROR");
    return {
      success: false,
      decision: "DENY",
      explanation: "Please provide a valid Order ID (e.g., ORD-1001) to process your refund request.",
      approvedAmount: 0,
      orderId: null,
      customerId: custRes.customer.id,
      logs,
      toolCallsExecuted,
      executionTimeMs: Date.now() - startTime,
    };
  }

  toolCallsExecuted.push("getOrder");
  const orderRes = await toolGetOrder(extractedOrderId);
  addLog("Step 3: Order Retrieval", `Order #${extractedOrderId} retrieved`, {
    found: orderRes.success,
    status: orderRes.order?.status,
    amount: orderRes.order?.totalAmount,
  }, orderRes.success ? "SUCCESS" : "ERROR");

  // Tool 3: validateRefundEligibility
  toolCallsExecuted.push("validateRefundEligibility");
  let requestedAmount: number | undefined = undefined;
  const amountMatch = params.userMessage.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (amountMatch) {
    requestedAmount = parseFloat(amountMatch[1]);
  }

  const evalRes = await evaluateRefundPolicy(extractedOrderId, custRes.customer.id, requestedAmount);
  addLog("Step 4: Policy Engine", evalRes.eligible ? "Policy validation passed" : `Policy validation failed: ${evalRes.reasonCode}`, {
    decision: evalRes.decision,
    reasonCode: evalRes.reasonCode,
    explanation: evalRes.explanation,
    checks: evalRes.checks,
  }, evalRes.eligible ? "SUCCESS" : "WARNING");

  // Tool 4: processRefundDecision
  toolCallsExecuted.push("processRefundDecision");
  const decisionRes = await toolProcessRefundDecision(
    extractedOrderId,
    custRes.customer.id,
    evalRes.decision,
    evalRes.calculatedAmount,
    params.userMessage
  );

  addLog("Step 5: Final Decision", `Decision: ${decisionRes.decision}`, {
    decision: decisionRes.decision,
    approvedAmount: decisionRes.approvedAmount,
    explanation: decisionRes.explanation,
  }, decisionRes.decision === "APPROVE" ? "SUCCESS" : "ERROR");

  return {
    success: true,
    decision: decisionRes.decision,
    explanation: decisionRes.explanation,
    approvedAmount: decisionRes.approvedAmount,
    orderId: extractedOrderId,
    customerId: custRes.customer.id,
    logs,
    toolCallsExecuted,
    executionTimeMs: Date.now() - startTime,
    checks: evalRes.checks,
  };
}
