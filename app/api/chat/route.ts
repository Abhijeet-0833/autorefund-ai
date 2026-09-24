import { NextRequest, NextResponse } from "next/server";
import { ChatRequestSchema } from "@/lib/validation/schemas";
import { runRefundAgent } from "@/lib/agent/refundAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { customerId, orderId, message } = validation.data;

    const result = await runRefundAgent({
      customerId,
      userMessage: message,
      orderIdHint: orderId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("API /api/chat Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while processing refund request.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
