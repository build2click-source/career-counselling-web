"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserAssessment {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPct: number;
  attemptId: string | null;
}

export default function DashboardTopPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<UserAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus === "authenticated") {
      fetch("/api/user-assessments")
        .then((r) => r.json())
        .then((data) => {
          if (!data.error && data.assessments) {
            setAssessments(data.assessments);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading assessments…</div>
      </div>
    );
  }

  const userName = session?.user?.email?.split("@")[0] ?? "there";

  return (
    <div className="text-[#2D3142] min-h-screen flex flex-col items-center bg-[#F4F7F6] font-sans pb-20">
      <main className="w-full max-w-[1000px] px-6 pt-12 flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#2D3142]">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-lg font-medium text-[#9095A7]">Select an assessment to begin or continue your journey.</p>
        </div>

        {assessments.length === 0 && (
           <div className="bg-white p-12 rounded-3xl shadow-sm text-center border border-slate-100 flex flex-col items-center">
             <div className="text-4xl mb-4">📋</div>
             <p className="text-slate-500 font-medium">No assessments are currently available.</p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map(asmt => {
            return (
              <div key={asmt.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center gap-6 hover:-translate-y-1 transition-transform">
                
                <div className="flex-1 flex flex-col gap-2 text-center w-full items-center">
                  <h2 className="text-2xl md:text-3xl font-black text-[#2D3142]">{asmt.title}</h2>
                  {asmt.description && <p className="text-[#9095A7] text-sm md:text-base leading-relaxed max-w-xl">{asmt.description}</p>}
                  
                  <div className="flex items-center gap-3 mt-3 justify-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                      {asmt.totalQuestions} Questions
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      asmt.status === 'COMPLETED' ? 'bg-[#4CB944]/10 text-[#4CB944]' :
                      asmt.status === 'IN_PROGRESS' ? 'bg-[#fb6a51]/10 text-[#fb6a51]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {asmt.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col w-full sm:flex-row items-center justify-center gap-4 shrink-0 border-t border-slate-100 pt-8 mt-2">
                  {asmt.status !== "NOT_STARTED" && (
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-3xl font-extrabold text-[#2D3142]">{asmt.progressPct}%</span>
                      <span className="text-[10px] font-semibold text-[#9095A7] uppercase tracking-wider">Complete</span>
                    </div>
                  )}

                  {asmt.status === "COMPLETED" && asmt.attemptId ? (
                    <Link href={`/results/${asmt.attemptId}`} className="w-full sm:w-auto">
                      <button className="w-full sm:w-[240px] px-8 py-3.5 rounded-full font-bold text-base bg-[#4CB944] text-white shadow-md hover:bg-[#3ea036] transition-colors">
                        View Results
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/dashboard/${asmt.id}`} className="w-full sm:w-auto">
                      <button className="w-full sm:w-[240px] px-8 py-3.5 rounded-full font-bold text-base bg-[#fb6a51] text-white shadow-md hover:bg-[#e55b44] active:scale-95 transition-all">
                        {asmt.status === "IN_PROGRESS" ? "Resume" : "Start Now"}
                      </button>
                    </Link>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
