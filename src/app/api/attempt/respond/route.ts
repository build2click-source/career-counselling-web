import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/attempt/respond  { attemptId, questionId, answerText, scoreValue }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { attemptId, questionId, answerText, scoreValue } = await request.json();
    if (!attemptId || !questionId || answerText === undefined) {
      return NextResponse.json({ error: "attemptId, questionId and answerText are required" }, { status: 400 });
    }

    // Upsert — if the user changed their answer, update it
    const response = await prisma.response.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { answerText: String(answerText), scoreValue: scoreValue ?? null },
      create: { attemptId, questionId, answerText: String(answerText), scoreValue: scoreValue ?? null },
    });

    return NextResponse.json({ responseId: response.id });
  } catch (error) {
    console.error("POST /api/attempt/respond error:", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
