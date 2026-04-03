import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ moduleId: string }> };

// GET — list all active (non-archived) questions for a module
export async function GET(_req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { moduleId } = await context.params;

  try {
    const mod = await prisma.assessmentModule.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true, type: true, order: true, assessmentId: true },
    });

    if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const questions = await prisma.question.findMany({
      where: { moduleId, isArchived: false },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ module: mod, questions });
  } catch (error) {
    console.error("GET questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// POST — add a new question to the module
export async function POST(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { moduleId } = await context.params;

  try {
    const body = await req.json();

    // Support bulk import (array) or single question
    const items = Array.isArray(body) ? body : [body];
    const created = [];

    for (const item of items) {
      if (!item.text || !item.options) {
        continue; // skip invalid
      }
      const q = await prisma.question.create({
        data: {
          moduleId,
          text: item.text,
          traitDimension: item.traitDimension ?? null,
          scoringPolarity: item.scoringPolarity ?? null,
          options: typeof item.options === "string" ? item.options : JSON.stringify(item.options),
          correctAnswer: item.correctAnswer ?? null,
          marks: item.marks ? Number(item.marks) : 1,
        },
      });
      created.push(q);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST question error:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

// PUT — update an existing question (expects { id, ...fields })
export async function PUT(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await context.params; // consume params

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const updated = await prisma.question.update({
      where: { id: body.id },
      data: {
        ...(body.text !== undefined && { text: body.text }),
        ...(body.traitDimension !== undefined && { traitDimension: body.traitDimension || null }),
        ...(body.scoringPolarity !== undefined && { scoringPolarity: body.scoringPolarity || null }),
        ...(body.options !== undefined && {
          options: typeof body.options === "string" ? body.options : JSON.stringify(body.options),
        }),
        ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer || null }),
        ...(body.marks !== undefined && { marks: Number(body.marks) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT question error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

// DELETE — soft delete (archive) a question
export async function DELETE(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await context.params; // consume params

  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId query param required" }, { status: 400 });
    }

    // Soft delete: archive instead of remove
    await prisma.question.update({
      where: { id: questionId },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, archived: questionId });
  } catch (error) {
    console.error("DELETE question error:", error);
    return NextResponse.json({ error: "Failed to archive question" }, { status: 500 });
  }
}
