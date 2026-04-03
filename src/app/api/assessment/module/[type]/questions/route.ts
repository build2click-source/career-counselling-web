import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/assessment/module/[type]/questions
// Returns all questions for a module matched by type (e.g. FFM, RIASEC, Cognitive, Values, SJT)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const module = await prisma.assessmentModule.findFirst({
      where: { type: { equals: type, mode: "insensitive" } },
      include: {
        questions: {
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            traitDimension: true,
            scoringPolarity: true,
            options: true,      // JSON string — parse on client
            correctAnswer: true,
            marks: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: `Module of type '${type}' not found` }, { status: 404 });
    }

    // Parse options JSON for each question
    const questions = module.questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options) as string[],
    }));

    return NextResponse.json({
      moduleId: module.id,
      title: module.title,
      type: module.type,
      order: module.order,
      questions,
    });
  } catch (error) {
    console.error("GET /api/assessment/module/[type] error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
