import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/assessment — returns list of all active assessments
export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({ error: "No assessments found" }, { status: 404 });
    }

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("GET /api/assessment error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
