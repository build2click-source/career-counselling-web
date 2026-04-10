import { prisma } from "@/lib/prisma";

export async function finalizeAttempt(attemptId: string) {
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt || attempt.isCompleted || attempt.responses.length === 0) return;

    // Pull module metadata (type) for each question via moduleId
    const moduleIds = [...new Set(attempt.responses.map((r) => r.question.moduleId))];
    const modules = await prisma.assessmentModule.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, type: true },
    });
    const moduleTypeMap: Record<string, string> = {};
    for (const m of modules) moduleTypeMap[m.id] = m.type;

    // ─── 1. Aggregate dimension scores ───────────────────────────────────
    const dimensionBuckets: Record<string, { sum: number; count: number }> = {};
    for (const resp of attempt.responses) {
      const q = resp.question;
      const dim = q.traitDimension ?? moduleTypeMap[q.moduleId] ?? "Unknown";
      const score = resp.scoreValue ?? 3; // default neutral if missing
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

    // ─── 2. Euclidean fitment against O*NET profiles ──────────────────────
    const occupationalProfiles = await prisma.occupationalProfile.findMany();
    const vectorKeys = [
      "Extraversion", "Agreeableness", "Conscientiousness", "Neuroticism", "Openness",
      "Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional",
      "Numerical Reasoning", "Verbal Reasoning", "Logical Reasoning",
    ];
    const userVector = vectorKeys.map((k) => (profileVector[k] ?? 50) / 20);

    const seenTitles = new Set<string>();
    const careerMatches = occupationalProfiles
      .map((profile) => {
        const target = JSON.parse(profile.targetVector) as number[];
        const distance = Math.sqrt(
          userVector.reduce((acc, v, i) => acc + Math.pow(v - (target[i] ?? 2.5), 2), 0)
        );
        const maxDist = Math.sqrt(vectorKeys.length * 25);
        const fitmentPct = Math.round((1 - distance / maxDist) * 100);
        return {
          id: profile.id,
          title: profile.title,
          fitment: Math.max(fitmentPct, 30),
        };
      })
      .sort((a, b) => b.fitment - a.fitment)
      .filter((m) => {
        if (seenTitles.has(m.title)) return false;
        seenTitles.add(m.title);
        return true;
      })
      .slice(0, 5);

    // ─── 3. Persist results ───────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          isCompleted: true,
          endTime: new Date(),
        },
      });

      await tx.fitmentScore.createMany({
        data: careerMatches.map((match) => ({
          attemptId: attempt.id,
          occupationalProfileId: match.id,
          euclideanDistance: 0,
          fitmentPercentage: match.fitment,
          matchedTags: "[]",
        })),
      });
    });

  } catch (error) {
    console.error("Error finalizing attempt:", error);
  }
}
