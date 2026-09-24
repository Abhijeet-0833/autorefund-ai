import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const totalRequests = await prisma.refundRequest.count();
    const approvedCount = await prisma.refundRequest.count({
      where: { decision: "APPROVE" },
    });
    const deniedCount = await prisma.refundRequest.count({
      where: { decision: "DENY" },
    });

    const approvedSumResult = await prisma.refundRequest.aggregate({
      _sum: { approvedAmount: true },
      where: { decision: "APPROVE" },
    });

    const recentRequests = await prisma.refundRequest.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, totalAmount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const recentLogs = await prisma.agentLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalRequests,
          approvedCount,
          deniedCount,
          totalApprovedAmount: approvedSumResult._sum.approvedAmount || 0,
        },
        recentRequests,
        recentLogs,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("API /api/admin/stats Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin stats." },
      { status: 500 }
    );
  }
}
