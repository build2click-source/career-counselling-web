"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Module {
  id: string;
  title: string;
  type: string;
  order: number;
  _count: { questions: number };
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface ModuleProgress {
  answered: number;
  total: number;
}

const MODULE_META: Record<string, { emoji: string; slug: string; color: string }> = {
  FFM:       { emoji: "🧠", slug: "FFM",       color: "bg-purple-100 text-purple-600" },
  RIASEC:    { emoji: "🎯", slug: "RIASEC",    color: "bg-orange-100 text-orange-600" },
  Cognitive: { emoji: "🧩", slug: "Cognitive", color: "bg-blue-100 text-blue-600" },
  Values:    { emoji: "✨", slug: "Values",    color: "bg-green-100 text-green-600" },
  SJT:       { emoji: "🧭", slug: "SJT",       color: "bg-pink-100 text-pink-600" },
};

export default function AssessmentModuleMapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && assessmentId) {
      Promise.all([
        fetch(`/api/assessment/${assessmentId}`).then((r) => r.json()),
        fetch(`/api/attempt/module-progress?assessmentId=${assessmentId}`).then((r) => r.json()),
      ])
        .then(([asmtData, progressData]) => {
          if (!asmtData.error) {
            setAssessment(asmtData);
          }
          const modProg = progressData.moduleProgress ?? {};
          setProgress(modProg);
          setAttemptId(progressData.attemptId || null);

          // Auto-redirect if complete and not admin
          if (asmtData.modules && !isAdmin) {
            const totalQ = asmtData.modules.reduce((s: number, m: any) => s + m._count.questions, 0);
            const answeredQ = Object.values(modProg).reduce((s: number, p: any) => s + p.answered, 0);
            if (totalQ > 0 && answeredQ >= totalQ && progressData.attemptId) {
              router.push(`/results/${progressData.attemptId}`);
              return;
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router, assessmentId]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading assessment map…</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center flex-col gap-4">
        <div className="text-slate-400 text-lg font-medium">Assessment not found.</div>
        <Link href="/dashboard" className="text-[#fb6a51] font-bold">← Back to Dashboard</Link>
      </div>
    );
  }

  const totalAnswered = Object.values(progress).reduce((s, p) => s + p.answered, 0);
  const totalQuestionsGlobal = Object.values(progress).reduce((s, p) => s + p.total, 0);
  const globalProgressPct = totalQuestionsGlobal > 0 ? Math.round((totalAnswered / totalQuestionsGlobal) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const globalDashOffset = circumference * (1 - globalProgressPct / 100);

  return (
    <div className="text-[#2D3142] min-h-screen flex flex-col items-center bg-[#F4F7F6] font-sans pb-20">
      <main className="w-full max-w-[800px] px-6 pt-10 flex flex-col gap-10">
        
        <Link href="/dashboard" className="text-[#fb6a51] font-bold flex items-center gap-2 hover:translate-x-[-4px] transition-transform w-fit -mb-4">
          ← Back to Assessments
        </Link>

        {/* ─── Welcome Header ─── */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white px-8 py-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col gap-2 flex-1 text-center md:text-left">
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <h1 className="text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight text-[#2D3142]">
                {assessment.title}
              </h1>
              {isAdmin && (
                <button
                  onClick={async () => {
                    if (confirm("Reset everything? Your current answers will be finalized and a fresh attempt started.")) {
                      setLoading(true);
                      await fetch("/api/admin/reset-attempt", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ assessmentId }),
                      });
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-1.5 rounded-full border border-[#fb6a51] text-[#fb6a51] text-xs font-bold hover:bg-[#fb6a51]/5 transition-colors"
                >
                  Retry Assessment (Admin)
                </button>
              )}
            </div>
            <p className="text-sm font-medium text-[#9095A7] line-clamp-2 leading-relaxed">{assessment.description || "Complete the modules below to finish this assessment."}</p>
          </div>

          <div className="relative flex items-center justify-center size-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F4F7F6" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="transparent"
                stroke="#4CB944"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={globalDashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-[#2D3142]">{globalProgressPct}%</span>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          {(() => {
            const moduleCompletions = assessment.modules.map(mod => {
              const modProgress = progress[mod.id];
              const answered = modProgress?.answered ?? 0;
              const total = modProgress?.total ?? mod._count.questions;
              return answered >= total && total > 0;
            });

            return assessment.modules.map((mod, idx) => {
              const meta = MODULE_META[mod.type] ?? { emoji: "📋", slug: mod.type, color: "bg-slate-100 text-slate-600" };
              const modProgress = progress[mod.id];
              const answered = modProgress?.answered ?? 0;
              const total = modProgress?.total ?? mod._count.questions;
              const modPct = total > 0 ? Math.round((answered / total) * 100) : 0;
              const isComplete = moduleCompletions[idx];
              const isUnlocked = idx === 0 || moduleCompletions[idx - 1];
              const isInProgress = answered > 0 && !isComplete;

              return (
                <div
                  key={mod.id}
                  className={`transition-all duration-300 bg-white flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-sm border p-6 ${
                    isComplete
                      ? "rounded-[2rem] border-[#4CB944]/20 hover:-translate-y-1"
                      : isInProgress || (isUnlocked && idx === 0)
                      ? "rounded-[2rem] border-[#fb6a51]/20 shadow-md hover:-translate-y-1"
                      : !isUnlocked
                      ? "rounded-[2rem] md:rounded-full border-slate-100 opacity-60 grayscale-[0.5]"
                      : "rounded-[2rem] md:rounded-full border-transparent hover:-translate-y-1"
                  }`}
                >
                  <div className={`size-16 rounded-full ${!isUnlocked ? "bg-slate-100 text-slate-400" : meta.color} flex items-center justify-center text-3xl shrink-0`}>
                    {isComplete ? "✅" : !isUnlocked ? "🔒" : meta.emoji}
                  </div>

                  <div className="flex-1 flex flex-col gap-2 w-full text-center md:text-left">
                    <h3 className={`text-xl font-bold ${!isUnlocked ? 'text-slate-500' : 'text-[#2D3142]'}`}>{mod.title}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#f8f6f5] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isComplete ? "bg-[#4CB944]" : "bg-[#fb6a51]"
                          }`}
                          style={{ width: `${modPct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#9095A7] whitespace-nowrap">
                        {answered}/{total}
                      </span>
                    </div>
                  </div>

                  <Link href={isComplete && !isAdmin ? "#" : `/assessment/${mod.id}?assessmentId=${assessment.id}`} className={(!isUnlocked && !isAdmin || (isComplete && !isAdmin)) ? "cursor-default pointer-events-none w-full md:w-auto" : "w-full md:w-auto"}>
                    <button
                      disabled={(!isUnlocked && !isAdmin) || (isComplete && !isAdmin)}
                      className={`w-full md:shrink-0 px-8 py-3 rounded-full font-bold text-base transition-colors ${
                        isComplete
                          ? "bg-[#4CB944]/10 text-[#4CB944] cursor-default"
                          : !isUnlocked
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          : "bg-[#fb6a51] text-white shadow-md hover:bg-[#e55b44]"
                      }`}
                      style={ (isComplete && isAdmin) ? { cursor: 'pointer', backgroundColor: '#fb6a51', color: 'white' } : {}}
                    >
                      {isComplete ? (isAdmin ? "Retake" : "Done") : !isUnlocked ? "Locked" : isInProgress ? "Resume" : "Start"}
                    </button>
                  </Link>
                </div>
              );
            });
          })()}
        </div>
      </main>
    </div>
  );
}
