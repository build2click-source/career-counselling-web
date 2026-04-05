import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id as string;

    const assessments = await prisma.assessment.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "asc" },
      include: {
        modules: {
          where: { isArchived: false },
          select: {
            _count: { select: { questions: { where: { isArchived: false } } } }
          }
        }
      }
    });

    const attemptHistory = await prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { responses: true } },
        fitmentScores: {
          orderBy: { fitmentPercentage: "desc" },
          take: 1,
          include: { occupationalProfile: { select: { title: true } } }
        }
      }
    });

    const userAssessments = assessments.map(asmt => {
      const totalQuestions = asmt.modules.reduce((sum, m) => sum + m._count.questions, 0);
      
      const asmtAttempts = attemptHistory.filter(a => a.assessmentId === asmt.id);
      const latestAttempt = asmtAttempts.length > 0 ? asmtAttempts[0] : null;

      const attemptsRemaining = Math.max(0, 1 - asmtAttempts.length);

      const pastAttempts = asmtAttempts.map(a => {
         return {
            id: a.id,
            createdAt: a.createdAt,
            isCompleted: a.isCompleted,
            topMatch: a.fitmentScores.length > 0 ? a.fitmentScores[0].occupationalProfile.title : null,
            fitment: a.fitmentScores.length > 0 ? a.fitmentScores[0].fitmentPercentage : null,
         };
      });

      let status = "NOT_STARTED";
      let progressPct = 0;
      let attemptId = null;

      if (latestAttempt) {
        attemptId = latestAttempt.id;
        const responsesCount = latestAttempt._count.responses;
        progressPct = totalQuestions > 0 ? Math.round((responsesCount / totalQuestions) * 100) : 0;
        
        if (latestAttempt.isCompleted) {
          status = "COMPLETED";
          progressPct = 100; // force 100 just in case
        } else {
          status = "IN_PROGRESS";
        }
      }

      return {
        id: asmt.id,
        title: asmt.title,
        description: asmt.description,
        totalQuestions,
        status,
        progressPct,
        attemptId,
        attemptsRemaining,
        pastAttempts,
      };
    });

    return NextResponse.json({ assessments: userAssessments });
  } catch (error) {
    console.error("GET /api/user-assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}
