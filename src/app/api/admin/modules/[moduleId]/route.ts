import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ moduleId: string }> };

// PUT /api/admin/modules/[moduleId] — update module title/type/order
export async function PUT(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { moduleId } = await context.params;

  try {
    const body = await req.json();
    const updated = await prisma.assessmentModule.update({
      where: { id: moduleId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.type && { type: body.type }),
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/modules error:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE /api/admin/modules/[moduleId] — delete entire module (cascades to questions)
export async function DELETE(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { moduleId } = await context.params;
    const module = await prisma.assessmentModule.findUnique({
      where: { id: moduleId },
      include: { assessment: { select: { _count: { select: { attempts: true } } } } }
    });

    if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    if (module.assessment._count.attempts > 0) {
      await prisma.assessmentModule.update({
        where: { id: moduleId },
        data: { isArchived: true }
      });
    } else {
      await prisma.assessmentModule.delete({ where: { id: moduleId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/modules error:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
