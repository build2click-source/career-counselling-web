import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/attempt/module-progress
// Returns per-module answer counts for the user's current attempt
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;

    // Find the user's current active attempt
    const attempt = await prisma.attempt.findFirst({
      where: {
        userId,
        isCompleted: false,
        sessionExpiry: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!attempt) {
      return NextResponse.json({ moduleProgress: {} });
    }

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
