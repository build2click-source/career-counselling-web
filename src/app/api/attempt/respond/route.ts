import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { finalizeAttempt } from "@/lib/computeResults";

// POST /api/attempt/respond  { attemptId, questionId, answerText, scoreValue }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await request.json();
    const responsesPayload = Array.isArray(payload.responses) ? payload.responses : [payload];

    if (responsesPayload.length === 0) {
      return NextResponse.json({ success: true });
    }

    const attemptId = responsesPayload[0].attemptId;
    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required in payload" }, { status: 400 });
    }

    // Upsert — if the user changed their answer, update it using transaction for safety
    await prisma.$transaction(
      responsesPayload.map((r: any) =>
        prisma.response.upsert({
          where: { attemptId_questionId: { attemptId: r.attemptId, questionId: r.questionId } },
          update: { answerText: String(r.answerText), scoreValue: r.scoreValue ?? null },
          create: { attemptId: r.attemptId, questionId: r.questionId, answerText: String(r.answerText), scoreValue: r.scoreValue ?? null },
        })
      )
    );

    // Automatically check for 100% completion
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            modules: {
              where: { isArchived: false },
              select: { _count: { select: { questions: { where: { isArchived: false } } } } }
            }
          }
        },
        _count: { select: { responses: true } }
      }
    });

    if (attempt && !attempt.isCompleted) {
      const totalQuestions = attempt.assessment.modules.reduce((sum, m) => sum + m._count.questions, 0);
      if (attempt._count.responses >= totalQuestions) {
        finalizeAttempt(attemptId).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, count: responsesPayload.length });
  } catch (error) {
    console.error("POST /api/attempt/respond error:", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
