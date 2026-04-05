import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/assessment/[id] — returns the specific assessment with all modules
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            _count: { select: { questions: { where: { isArchived: false } } } },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("GET /api/assessment/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
