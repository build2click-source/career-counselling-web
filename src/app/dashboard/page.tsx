"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PastAttempt {
  id: string;
  createdAt: string;
  isCompleted: boolean;
  topMatch: string | null;
  fitment: number | null;
}

interface UserAssessment {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPct: number;
  attemptId: string | null;
  attemptsRemaining: number;
  pastAttempts: PastAttempt[];
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
                
                <div className="flex flex-col gap-2 text-center w-full items-center">
                  <h2 className="text-2xl md:text-3xl font-black text-[#2D3142]">{asmt.title}</h2>
                  {asmt.description && <p className="text-[#9095A7] text-sm md:text-base leading-relaxed max-w-xl">{asmt.description}</p>}
                  
                  <div className="flex flex-wrap items-center gap-2 mt-4 justify-center">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                      {asmt.totalQuestions} Questions
                    </span>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
                      asmt.status === 'COMPLETED' ? 'bg-[#4CB944]/15 text-[#4CB944]' :
                      asmt.status === 'IN_PROGRESS' ? 'bg-[#fb6a51]/15 text-[#fb6a51]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {asmt.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#fb6a51] bg-[#fb6a51]/5 border border-[#fb6a51]/20 px-3 py-1.5 rounded-full">
                      {asmt.attemptsRemaining} Attempts Left
                    </span>
                  </div>
                </div>

                {asmt.status === "IN_PROGRESS" && (
                  <div className="w-full flex flex-col gap-1.5 mt-2 px-4 max-w-[400px]">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-extrabold text-[#2D3142]">{asmt.progressPct}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#fb6a51] to-[#f97316] rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${asmt.progressPct}%` }}
                        />
                     </div>
                  </div>
                )}

                <div className={`flex flex-col w-full sm:flex-row items-center justify-center gap-4 shrink-0 ${asmt.status !== 'NOT_STARTED' ? 'border-t border-slate-100 pt-8 mt-2' : 'mt-4'}`}>
                  {asmt.status === "COMPLETED" && asmt.attemptId ? (
                    <div className="flex flex-col w-full sm:w-auto gap-3">
                      <Link href={`/results/${asmt.attemptId}`} className="w-full">
                        <button className="w-full sm:w-[260px] px-8 py-3.5 rounded-full font-bold text-base bg-[#4CB944] text-white shadow-md hover:bg-[#3ea036] hover:shadow-lg transition-all active:scale-95">
                          Latest Results
                        </button>
                      </Link>
                      {asmt.attemptsRemaining > 0 && (
                        <Link href={`/dashboard/${asmt.id}`} className="w-full">
                          <button className="w-full sm:w-[260px] px-8 py-3 rounded-full font-bold text-sm border-2 border-[#fb6a51] text-[#fb6a51] hover:bg-[#fb6a51] hover:text-white transition-all active:scale-95">
                            Retry Assessment
                          </button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <Link href={`/dashboard/${asmt.id}`} className="w-full sm:w-auto">
                      <button 
                        disabled={asmt.attemptsRemaining === 0 && asmt.status === "NOT_STARTED"}
                        className="w-full sm:w-[260px] px-8 py-3.5 rounded-full font-bold text-base bg-[#fb6a51] text-white shadow-md hover:bg-[#e55b44] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {asmt.status === "IN_PROGRESS" ? "Resume Assessment" : "Start Assessment"}
                      </button>
                    </Link>
                  )}
                </div>

                {asmt.pastAttempts && asmt.pastAttempts.length > 0 && (
                  <div className="w-full mt-4 flex flex-col pt-6 border-t border-slate-100">
                    <p className="text-[10px] sm:text-xs font-bold text-[#9095A7] uppercase tracking-widest pl-2 mb-3">Attempt History</p>
                    <div className="flex flex-col gap-0 border border-slate-100/60 rounded-[1.5rem] overflow-hidden bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                      {asmt.pastAttempts.map((past, i) => (
                        <div key={past.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm p-4 hover:bg-slate-50/50 transition-colors ${i !== asmt.pastAttempts.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 font-extrabold text-xs">
                               {asmt.pastAttempts.length - i}
                             </div>
                             <div className="flex flex-col">
                               <span className="font-bold text-[#2D3142] text-sm">Attempt {asmt.pastAttempts.length - i}</span>
                               <span className="text-[#9095A7] text-[11px] font-medium tracking-wide">{new Date(past.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                             </div>
                          </div>
                          <div className="mt-3 sm:mt-0 ml-12 sm:ml-0 flex-[0.8] sm:flex-none">
                            {past.isCompleted ? (
                               <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto overflow-hidden">
                                     <span className="font-extrabold text-[#2D3142] text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px] block" title={past.topMatch || "Pending"}>{past.topMatch || "Pending"}</span>
                                     {past.fitment && <span className="font-bold text-[#4CB944] text-[10px] tracking-widest uppercase mt-0.5">{past.fitment}% Match</span>}
                                  </div>
                                  <Link href={`/results/${past.id}`} className="flex items-center justify-center shrink-0 size-8 sm:size-10 bg-slate-50 hover:bg-[#fb6a51]/10 text-slate-400 hover:text-[#fb6a51] rounded-full transition-all border border-slate-100">
                                     <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                  </Link>
                               </div>
                            ) : (
                               <span className="font-bold text-[#f97316] text-[9px] sm:text-[10px] uppercase tracking-widest bg-[#f97316]/10 px-3 py-1.5 rounded-full inline-block">In Progress</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
