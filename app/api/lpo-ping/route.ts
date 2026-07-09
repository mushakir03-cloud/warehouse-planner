import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Tiny endpoint the warehouse screen polls to learn about new LPOs
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const latest = await prisma.lpo.findFirst({
    orderBy: { id: "desc" },
    select: { id: true, customerName: true },
  });
  return NextResponse.json({
    maxId: latest?.id ?? 0,
    customerName: latest?.customerName ?? "",
  });
}
