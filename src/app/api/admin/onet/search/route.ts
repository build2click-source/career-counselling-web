import { NextRequest, NextResponse } from "next/server";
import { onetClient } from "@/lib/onet/ONetClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    const results = await onetClient.searchOccupations(keyword);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET /api/admin/onet/search error:", error);
    return NextResponse.json({ error: error.message || "Failed to search O*NET" }, { status: 500 });
  }
}
