import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/attempt/module-progress
// Returns per-module answer counts for the user's current attempt
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId") || undefined;

    // Find all attempts for this assessment and pick the one with most progress, or the latest
    const attempts = await prisma.attempt.findMany({
      where: {
        userId,
        assessmentId,
      },
      include: {
        _count: { select: { responses: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    if (attempts.length === 0) {
      return NextResponse.json({ moduleProgress: {} });
    }

    // Prioritize the attempt with the most responses (if any have responses)
    // Otherwise just use the latest one
    const attempt = attempts.sort((a, b) => b._count.responses - a._count.responses)[0];

    // Count responses per module
    const responses = await prisma.response.findMany({
      where: { attemptId: attempt.id },
      select: {
        question: {
          select: { moduleId: true },
        },
      },
    });

    // Also get total questions per module (non-archived)
    const modules = await prisma.assessmentModule.findMany({
      where: { assessmentId: attempt.assessmentId },
      select: {
        id: true,
        _count: { select: { questions: { where: { isArchived: false } } } },
      },
    });

    const answeredPerModule: Record<string, number> = {};
    for (const r of responses) {
      const mid = r.question.moduleId;
      answeredPerModule[mid] = (answeredPerModule[mid] || 0) + 1;
    }

    const moduleProgress: Record<string, { answered: number; total: number }> = {};
    for (const m of modules) {
      moduleProgress[m.id] = {
        answered: answeredPerModule[m.id] || 0,
        total: m._count.questions,
      };
    }

    return NextResponse.json({ moduleProgress });
  } catch (error) {
    console.error("GET /api/attempt/module-progress error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
