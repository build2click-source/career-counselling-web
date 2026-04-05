import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        assessment: { select: { title: true } },
        fitmentScores: {
          include: {
            occupationalProfile: { select: { title: true } }
          },
          orderBy: { fitmentPercentage: 'desc' }
        },
        responses: {
          include: {
            question: {
              include: {
                module: {
                  select: { id: true, title: true, type: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Calculate resultsData
    const dimensionBuckets: Record<string, { sum: number; count: number }> = {};
    for (const resp of attempt.responses) {
      const q = resp.question;
      const dim = q.traitDimension ?? q.module.type ?? "Unknown";
      const score = resp.scoreValue ?? 3;
      const polarity = q.scoringPolarity ?? "Positive (+)";
      const adjusted = polarity === "Negative (-)" ? 6 - score : score;

      if (!dimensionBuckets[dim]) dimensionBuckets[dim] = { sum: 0, count: 0 };
      dimensionBuckets[dim].sum += adjusted;
      dimensionBuckets[dim].count += 1;
    }

    const profileVector: Record<string, number> = {};
    for (const [dim, { sum, count }] of Object.entries(dimensionBuckets)) {
      const avg = sum / count;
      profileVector[dim] = Math.round(((avg - 1) / 4) * 100);
    }

    const radarData = [
      { subject: "Extraversion",      score: profileVector["Extraversion"] ?? 50 },
      { subject: "Openness",           score: profileVector["Openness"] ?? 50 },
      { subject: "Conscientiousness",  score: profileVector["Conscientiousness"] ?? 50 },
      { subject: "Agreeableness",      score: profileVector["Agreeableness"] ?? 50 },
      { subject: "Stability",          score: 100 - (profileVector["Neuroticism"] ?? 50) },
      { subject: "Investigative",      score: profileVector["Investigative"] ?? 50 },
      { subject: "Enterprising",       score: profileVector["Enterprising"] ?? 50 },
      { subject: "Social",             score: profileVector["Social"] ?? 50 },
    ];

    const big5 = {
      Extraversion:      profileVector["Extraversion"] ?? 0,
      Agreeableness:     profileVector["Agreeableness"] ?? 0,
      Conscientiousness: profileVector["Conscientiousness"] ?? 0,
      Neuroticism:       profileVector["Neuroticism"] ?? 0,
      Openness:          profileVector["Openness"] ?? 0,
    };

    const cognitiveBreakdown = [
      { area: "Numerical Reasoning", pct: profileVector["Numerical Reasoning"] ?? 0 },
      { area: "Verbal Reasoning",    pct: profileVector["Verbal Reasoning"] ?? 0 },
      { area: "Logical Reasoning",   pct: profileVector["Logical Reasoning"] ?? 0 },
    ];

    const careerMatches = attempt.fitmentScores.map(f => ({
      id: f.occupationalProfileId,
      title: f.occupationalProfile.title,
      description: "", 
      fitment: Math.round(f.fitmentPercentage)
    })).sort((a, b) => b.fitment - a.fitment).slice(0, 5);

    const resultsData = {
      big5,
      radarData,
      cognitiveBreakdown,
      careerMatches
    };

    return NextResponse.json({ ...attempt, resultsData });
  } catch (error) {
    console.error("GET /api/admin/attempts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch attempt details" }, { status: 500 });
  }
}
