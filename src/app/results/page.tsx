"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CareerMatch {
  id: string;
  title: string;
  description: string;
  fitment: number;
}

interface RadarPoint {
  subject: string;
  score: number;
}

interface CognitiveBreakdown {
  area: string;
  pct: number;
}

interface Big5 {
  Extraversion: number;
  Agreeableness: number;
  Conscientiousness: number;
  Neuroticism: number;
  Openness: number;
}

interface ResultsData {
  attemptId: string;
  totalAnswered: number;
  big5: Big5;
  radarData: RadarPoint[];
  cognitiveBreakdown: CognitiveBreakdown[];
  careerMatches: CareerMatch[];
}

const BIG5_DESCRIPTORS: Record<keyof Big5, string> = {
  Extraversion:      "Sociable, energetic, assertive",
  Agreeableness:     "Compassionate, cooperative, empathetic",
  Conscientiousness: "Organized, disciplined, goal-oriented",
  Neuroticism:       "Emotional sensitivity, stress-prone",
  Openness:          "Curious, creative, imaginative",
};

const MATCH_COLORS = ["#fb6a51", "#f97316", "#fb923c", "#fbbf24", "#a3a3a3"];

function FitmentBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-extrabold text-slate-700 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function ResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/results")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); setLoading(false); return; }
        setData(json);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load results."); setLoading(false); });
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-spin">⚙️</div>
        <p className="text-slate-400 font-medium animate-pulse">Computing your Career DNA…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="text-5xl">📭</div>
        <h1 className="text-2xl font-extrabold text-slate-700">No Results Yet</h1>
        <p className="text-slate-500 max-w-sm">
          {error ?? "Complete at least one assessment module to see your results here."}
        </p>
        <Link href="/dashboard">
          <button className="px-8 py-3 rounded-full bg-[#fb6a51] text-white font-bold shadow-md hover:bg-[#e55b44] transition-all">
            Go to Dashboard →
          </button>
        </Link>
      </div>
    );
  }

  const topMatch = data.careerMatches[0];

  return (
    <div className="min-h-screen bg-[#f8f6f5] text-slate-900 font-sans">
      <div className="max-w-[900px] mx-auto px-6 py-12 flex flex-col gap-10">

        {/* ─── Hero Banner ─── */}
        <div className="bg-gradient-to-br from-[#fb6a51] to-[#f97316] rounded-3xl p-6 md:p-10 text-white text-center shadow-xl shadow-[#fb6a51]/20 mx-2 md:mx-0">
          <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Your Career DNA Results</p>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
            🎯 {topMatch.title}
          </h1>
          <p className="text-white/80 text-sm md:text-lg mb-6">{topMatch.description}</p>
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur rounded-full px-4 md:px-6 py-2 md:py-3">
            <span className="text-lg md:text-2xl text-white font-extrabold">{topMatch.fitment}%</span>
            <span className="text-white/80 text-xs md:text-sm font-semibold">Fitment Score</span>
          </div>
          <p className="text-white/60 text-[10px] md:text-xs mt-4">{data.totalAnswered} questions answered</p>
        </div>

        {/* ─── Top Career Matches ─── */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Top Career Matches</h2>
          <div className="flex flex-col gap-5">
            {data.careerMatches.map((match, i) => (
              <div key={match.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center text-white`}
                      style={{ backgroundColor: MATCH_COLORS[i] }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{match.title}</p>
                      <p className="text-slate-400 text-xs">{match.description}</p>
                    </div>
                  </div>
                </div>
                <FitmentBar pct={match.fitment} color={MATCH_COLORS[i]} />
              </div>
            ))}
          </div>
        </section>

        {/* ─── Radar Chart + Big 5 ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Personality & Interest Radar</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={data.radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                />
                <Radar
                  name="Your Profile"
                  dataKey="score"
                  stroke="#fb6a51"
                  fill="#fb6a51"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Score"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #f1f5f9", fontSize: "13px" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Big 5 Bars */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Big Five Personality</h2>
            <div className="flex flex-col gap-4">
              {(Object.entries(data.big5) as [keyof Big5, number][]).map(([trait, score]) => (
                <div key={trait} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{trait}</p>
                      <p className="text-xs text-slate-400">{BIG5_DESCRIPTORS[trait]}</p>
                    </div>
                    <span className="text-sm font-extrabold text-[#fb6a51]">{score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#fb6a51] to-[#f97316] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Cognitive Breakdown ─── */}
        {data.cognitiveBreakdown.some((c) => c.pct > 0) && (
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Cognitive Aptitude</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {data.cognitiveBreakdown.map((c) => (
                <div
                  key={c.area}
                  className="flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl bg-[#f8f6f5]"
                >
                  <div className="relative size-16 md:size-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#fb6a51" strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - c.pct / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base md:text-lg font-extrabold text-[#fb6a51]">{c.pct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs font-bold text-slate-600 text-center">{c.area}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── CTA ─── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link href="/dashboard">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-slate-200 text-slate-700 font-bold hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all">
              ← Back to Dashboard
            </button>
          </Link>
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#fb6a51] text-white font-bold shadow-lg shadow-[#fb6a51]/25 hover:bg-[#e55b44] transition-all"
          >
            Download Report 📄
          </button>
        </div>
      </div>
    </div>
  );
}
