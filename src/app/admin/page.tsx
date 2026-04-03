"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Candidate {
  id: string;
  email: string;
  status: string;
  topMatch: string;
  lastActive: string;
}

interface Stats {
  totalStudents: number;
  completedAttempts: number;
  inProgressAttempts: number;
  candidates: Candidate[];
}

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-[#4CB944]/10 text-[#4CB944]",
  "Not Started": "bg-gray-100 text-gray-500",
};

function getStatusStyle(status: string) {
  if (status.includes("Completed")) return STATUS_STYLE["Completed"];
  if (status.includes("Progress")) return "bg-[#fb6a51]/10 text-[#fb6a51]";
  return STATUS_STYLE["Not Started"];
}

export default function AdminDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }

    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, session, router]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading admin panel…</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-500">Failed to load admin data.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F6] text-[#2D3142] min-h-screen font-sans">
      <div className="w-full max-w-[1100px] mx-auto px-6 pb-20">

        {/* ─── Tab Nav ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-6 pb-8">
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-full bg-[#fb6a51] text-white text-sm font-bold shadow-sm text-center"
          >
            Overview
          </Link>
          <Link
            href="/admin/assessments"
            className="px-5 py-2.5 rounded-full bg-white text-slate-600 text-sm font-bold border border-slate-200 hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all text-center"
          >
            Manage Assessments
          </Link>
          <Link
            href="/admin/profiles"
            className="px-5 py-2.5 rounded-full bg-white text-slate-600 text-sm font-bold border border-slate-200 hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all text-center"
          >
            Occupational Profiles
          </Link>
        </div>

        {/* ─── Metric Cards ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1 md:gap-2">
            <span className="text-[10px] md:text-xs font-bold text-[#9095A7] uppercase tracking-wider">Total Students</span>
            <span className="text-3xl md:text-4xl font-extrabold text-[#fb6a51]">{stats.totalStudents}</span>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1 md:gap-2">
            <span className="text-[10px] md:text-xs font-bold text-[#9095A7] uppercase tracking-wider">Completed</span>
            <span className="text-3xl md:text-4xl font-extrabold text-[#4CB944]">{stats.completedAttempts}</span>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1 md:gap-2">
            <span className="text-[10px] md:text-xs font-bold text-[#9095A7] uppercase tracking-wider">In Progress</span>
            <span className="text-3xl md:text-4xl font-extrabold text-[#f97316]">{stats.inProgressAttempts}</span>
          </div>
        </section>

        {/* ─── Candidates Table ─── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-2xl font-bold text-[#2D3142] mb-6">Recent Candidates</h3>
          {stats.candidates.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No students registered yet.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#f4e8e6] text-[#9095A7] text-sm uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Candidate</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Top Match</th>
                    <th className="pb-3 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.candidates.map((c) => (
                    <tr key={c.id} className="border-b border-[#f4e8e6] hover:bg-[#f8f6f5] transition-colors">
                      <td className="py-4">
                        <span className="font-bold text-[#2D3142]">{c.email}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 font-medium text-[#2D3142]">{c.topMatch}</td>
                      <td className="py-4 text-[#9095A7] text-sm">
                        {formatDistanceToNow(new Date(c.lastActive), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
