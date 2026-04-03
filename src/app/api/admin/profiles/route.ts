import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Handle Occupational Profile CRUD Operations
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profiles = await prisma.occupationalProfile.findMany({
      orderBy: { title: "asc" }
    });

    return NextResponse.json(profiles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, description, targetVector } = await request.json();

    if (!title || !description || !targetVector) {
      return NextResponse.json({ error: "Title, description and targetVector are required" }, { status: 400 });
    }

    // Upsert — Create or Update
    const profile = await prisma.occupationalProfile.upsert({
      where: { id: id || "new-dummy-id" },
      update: { title, description, targetVector: JSON.stringify(targetVector) },
      create: { title, description, targetVector: JSON.stringify(targetVector) }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("POST /api/admin/profiles error:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.occupationalProfile.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
