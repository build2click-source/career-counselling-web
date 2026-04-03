import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/assessment — returns the primary assessment with all modules
export async function GET() {
  try {
    const assessment = await prisma.assessment.findFirst({
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

    if (!assessment) {
      return NextResponse.json({ error: "No assessment found" }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("GET /api/assessment error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
