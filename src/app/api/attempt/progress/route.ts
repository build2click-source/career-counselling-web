import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/attempt/progress?attemptId=...&moduleId=...
// Returns previously saved responses for a specific module within an attempt
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");
    const moduleId = searchParams.get("moduleId");

    if (!attemptId || !moduleId) {
      return NextResponse.json({ error: "attemptId and moduleId are required" }, { status: 400 });
    }

    // Get all responses for this attempt that belong to questions in this module
    const responses = await prisma.response.findMany({
      where: {
        attemptId,
        question: { moduleId, isArchived: false },
      },
      select: {
        questionId: true,
        scoreValue: true,
      },
    });

    // Build a map of questionId → scoreValue
    const answeredMap: Record<string, number> = {};
    for (const r of responses) {
      if (r.scoreValue !== null) {
        answeredMap[r.questionId] = r.scoreValue;
      }
    }

    return NextResponse.json({ answeredMap, totalAnswered: Object.keys(answeredMap).length });
  } catch (error) {
    console.error("GET /api/attempt/progress error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
