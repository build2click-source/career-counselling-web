import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/admin/assessments — list all assessments with modules + question counts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            _count: { select: { questions: { where: { isArchived: false } } } },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("GET /api/admin/assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}

// POST /api/admin/assessments — create a new assessment with modules
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, timeLimitMinutes, modules } = body;

    if (!title || !timeLimitMinutes) {
      return NextResponse.json({ error: "Title and time limit are required" }, { status: 400 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description: description ?? "",
        timeLimitMinutes: Number(timeLimitMinutes),
        modules: modules?.length
          ? {
              create: modules.map((m: { title: string; type: string }, i: number) => ({
                title: m.title,
                type: m.type,
                order: i + 1,
              })),
            }
          : undefined,
      },
      include: {
        modules: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/assessments error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
