import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    const completedAttempts = await prisma.attempt.count({ where: { isCompleted: true } });
    const inProgressAttempts = await prisma.attempt.count({ where: { isCompleted: false } });

    // Recent attempts: latest 15 active attempts across the platform
    const recentAttempts = await prisma.attempt.findMany({
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: {
        user: { select: { email: true, id: true } },
        assessment: { select: { title: true } },
        fitmentScores: {
          orderBy: { fitmentPercentage: "desc" },
          take: 1,
          include: { occupationalProfile: { select: { title: true } } },
        },
        _count: { select: { responses: true } },
      },
    });

    // Dynamic question counts per assessment for accurate progress
    const assessments = await prisma.assessment.findMany({
      select: {
        id: true,
        modules: {
          select: { _count: { select: { questions: { where: { isArchived: false } } } } },
        },
      },
    });

    const questionCountsByAssessment: Record<string, number> = {};
    for (const a of assessments) {
      questionCountsByAssessment[a.id] = a.modules.reduce((sum, m) => sum + m._count.questions, 0);
    }

    const candidates = recentAttempts.map((attempt) => {
      let status = "Not Started";
      let topMatch = "Pending";
      const totalQuestions = questionCountsByAssessment[attempt.assessmentId] || 0;

      if (attempt.isCompleted) {
        status = "Completed";
        const topFit = attempt.fitmentScores[0];
        if (topFit) topMatch = `${topFit.occupationalProfile.title} (${Math.round(topFit.fitmentPercentage)}%)`;
      } else {
        const answered = attempt._count.responses;
        const progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
        status = answered > 0 ? `In Progress (${progress}%)` : "Not Started";
      }

      return {
        id: attempt.id, // using attempt.id as row key
        attemptId: attempt.id,
        email: attempt.user.email,
        assessmentName: attempt.assessment.title,
        status,
        topMatch,
        lastActive: attempt.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      totalStudents,
      completedAttempts,
      inProgressAttempts,
      candidates,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
