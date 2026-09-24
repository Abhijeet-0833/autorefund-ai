import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          include: {
            items: true,
          },
          orderBy: { purchaseDate: "desc" },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, customers }, { status: 200 });
  } catch (error: unknown) {
    console.error("API /api/customers Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers from CRM database." },
      { status: 500 }
    );
  }
}
