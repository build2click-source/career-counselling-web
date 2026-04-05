import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addDays } from "date-fns";

// POST /api/attempt/start  { assessmentId }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assessmentId } = await request.json();
    if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });

    const userId = (session.user as any).id as string;

    // Re-use an existing incomplete attempt if one exists within the 5-day window
    const existing = await prisma.attempt.findFirst({
      where: {
        userId,
        assessmentId,
        isCompleted: false,
        sessionExpiry: { gt: new Date() },
      },
    });

    if (existing) return NextResponse.json({ attemptId: existing.id });

    // Validate limit of 3 past attempts
    const totalAttempts = await prisma.attempt.count({
      where: { userId, assessmentId }
    });

    if (totalAttempts >= 3) {
      return NextResponse.json({ error: "Maximum limit of 3 attempts reached for this assessment." }, { status: 403 });
    }

    const attempt = await prisma.attempt.create({
      data: {
        userId,
        assessmentId,
        sessionExpiry: addDays(new Date(), 5),
      },
    });

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error) {
    console.error("POST /api/attempt/start error:", error);
    return NextResponse.json({ error: "Failed to start attempt" }, { status: 500 });
  }
}
