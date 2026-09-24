import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const logs = await prisma.agentLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error: unknown) {
    console.error("API /api/logs Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent execution logs." },
      { status: 500 }
    );
  }
}
