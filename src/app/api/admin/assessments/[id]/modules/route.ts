import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, type } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current max order
    const existing = await prisma.assessmentModule.findMany({
      where: { assessmentId: id },
      orderBy: { order: 'desc' },
      take: 1
    });
    
    const newOrder = existing.length > 0 ? existing[0].order + 1 : 1;

    const newModule = await prisma.assessmentModule.create({
      data: {
        title,
        type,
        order: newOrder,
        assessmentId: id
      }
    });

    return NextResponse.json(newModule);
  } catch (error) {
    console.error("POST /api/admin/assessments/[id]/modules error:", error);
    return NextResponse.json({ error: "Failed to add module" }, { status: 500 });
  }
}
