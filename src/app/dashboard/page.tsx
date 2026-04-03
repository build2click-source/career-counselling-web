"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/assessment").then((r) => r.json()),
        fetch("/api/attempt/module-progress").then((r) => r.json()),
      ])
        .then(([asmtData, progressData]) => {
          setAssessment(asmtData);
          setProgress(progressData.moduleProgress ?? {});
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading your assessments…</div>
      </div>
    );
  }

  const userName = session?.user?.email?.split("@")[0] ?? "there";
  const totalModules = assessment?.modules.length ?? 0;

  // Calculate overall progress from per-module data
  const completedModules = assessment?.modules.filter((mod) => {
    const p = progress[mod.id];
    return p && p.total > 0 && p.answered >= p.total;
  }).length ?? 0;

  const totalAnswered = Object.values(progress).reduce((s, p) => s + p.answered, 0);
  const totalQuestions = Object.values(progress).reduce((s, p) => s + p.total, 0);
  const progressPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - progressPct / 100);

  return (
    <div className="text-[#2D3142] min-h-screen flex flex-col items-center bg-[#F4F7F6] font-sans pb-20">
      <main className="w-full max-w-[800px] px-6 pt-8 flex flex-col gap-10">

        {/* ─── Welcome + Progress Ring ─── */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#2D3142]">
              Hey, {userName} 👋
            </h1>
            <p className="text-lg font-medium text-[#9095A7]">Your Career DNA journey</p>
            <p className="text-sm text-slate-400">
              {assessment?.title ?? "Career Assessment"} · {totalModules} modules · {totalQuestions} questions
            </p>
          </div>

          <div className="relative flex items-center justify-center size-40 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F4F7F6" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="transparent"
                stroke="#4CB944"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-[#2D3142]">{progressPct}%</span>
              <span className="text-xs font-semibold text-[#9095A7] uppercase tracking-wider">Complete</span>
            </div>
          </div>
        </section>

        {/* ─── Module Cards ─── */}
        <section className="flex flex-col gap-5">
          {assessment?.modules.map((mod, idx) => {
            const meta = MODULE_META[mod.type] ?? { emoji: "📋", slug: mod.type, color: "bg-slate-100 text-slate-600" };
            const modProgress = progress[mod.id];
            const answered = modProgress?.answered ?? 0;
            const total = modProgress?.total ?? mod._count.questions;
            const modPct = total > 0 ? Math.round((answered / total) * 100) : 0;
            const isComplete = answered >= total && total > 0;
            const isInProgress = answered > 0 && !isComplete;
            const isFirst = idx === 0 && !isInProgress && !isComplete;

            return (
              <div
                key={mod.id}
                className={`transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-sm border p-6 ${
                  isComplete
                    ? "rounded-[2rem] border-[#4CB944]/20"
                    : isInProgress || isFirst
                    ? "rounded-[2rem] border-[#fb6a51]/20 shadow-md"
                    : "rounded-[2rem] md:rounded-full border-transparent"
                }`}
              >
                <div className={`size-16 rounded-full ${meta.color} flex items-center justify-center text-3xl shrink-0`}>
                  {isComplete ? "✅" : meta.emoji}
                </div>

                <div className="flex-1 flex flex-col gap-2 w-full text-center md:text-left">
                  <h3 className="text-xl font-bold text-[#2D3142]">{mod.title}</h3>
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

                <Link href={isComplete ? "#" : `/assessment/${meta.slug}`} className="w-full md:w-auto">
                  <button
                    disabled={isComplete}
                    className={`w-full md:shrink-0 px-8 py-3 rounded-full font-bold text-base transition-colors ${
                      isComplete
                        ? "bg-[#4CB944]/10 text-[#4CB944] cursor-default"
                        : isInProgress
                        ? "bg-[#fb6a51] text-white shadow-md hover:bg-[#e55b44]"
                        : isFirst
                        ? "bg-[#fb6a51] text-white shadow-md hover:bg-[#e55b44]"
                        : "bg-white border-2 border-[#fb6a51] text-[#fb6a51] hover:bg-[#fb6a51]/5"
                    }`}
                  >
                    {isComplete ? "Done" : isInProgress ? "Resume" : "Start"}
                  </button>
                </Link>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
