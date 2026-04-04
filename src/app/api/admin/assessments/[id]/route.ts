import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await Promise.resolve(params);

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { _count: { select: { attempts: true } } }
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment._count.attempts > 0) {
      // Archive assessment and its modules
      await prisma.assessment.update({
        where: { id },
        data: { isArchived: true }
      });
      await prisma.assessmentModule.updateMany({
        where: { assessmentId: id },
        data: { isArchived: true }
      });
    } else {
      await prisma.assessment.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await Promise.resolve(params);

  try {
    const body = await request.json();
    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.timeLimitMinutes !== undefined && { timeLimitMinutes: Number(body.timeLimitMinutes) }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/assessments/[id] error:", error);
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
  }
}
