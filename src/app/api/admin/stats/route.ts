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

    // Recent candidates: latest 10 students with their most recent attempt
    const recentStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            fitmentScores: {
              orderBy: { fitmentPercentage: "desc" },
              take: 1,
              include: { occupationalProfile: { select: { title: true } } },
            },
            _count: { select: { responses: true } },
          },
        },
      },
    });

    // Dynamic question count for progress calculation
    const totalQuestions = await prisma.question.count({ where: { isArchived: false } });

    const candidates = recentStudents.map((student) => {
      const attempt = student.attempts[0];
      let status = "Not Started";
      let topMatch = "Pending";
      let lastActive = student.createdAt.toISOString();
      let progress = 0;
      let attemptId = attempt?.id || null;

      if (attempt) {
        lastActive = attempt.updatedAt.toISOString();
        if (attempt.isCompleted) {
          status = "Completed";
          const topFit = attempt.fitmentScores[0];
          if (topFit) {
            topMatch = `${topFit.occupationalProfile.title} (${Math.round(topFit.fitmentPercentage)}%)`;
          }
          progress = 100;
        } else {
          // Estimate progress from response count vs total questions
          const answered = attempt._count.responses;
          progress = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
          status = `In Progress (${progress}%)`;
        }
      }

      return {
        id: student.id,
        attemptId,
        email: student.email,
        status,
        topMatch,
        lastActive,
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
