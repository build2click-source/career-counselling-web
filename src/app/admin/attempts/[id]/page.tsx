"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const BIG5_DESCRIPTORS: Record<string, string> = {
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

export default function AdminAttemptDetailsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for tracking which modules are expanded
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }

    if (id) {
      fetch(`/api/admin/attempts/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setAttempt(data);
          setLoading(false);
          // By default expand the first module
          if (data && !data.error && data.responses.length > 0) {
              const firstModId = data.responses[0].question.module.id;
              setExpandedModules({ [firstModId]: true });
          }
        })
        .catch(() => setLoading(false));
    }
  }, [authStatus, session, router, id]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading attempt details…</div>
      </div>
    );
  }

  if (!attempt || attempt.error) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center flex-col gap-4">
        <div className="text-slate-500">Attempt not found or an error occurred.</div>
        <Link href="/admin" className="text-[#fb6a51] hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const topMatch = attempt.fitmentScores[0];
  const { resultsData } = attempt;

  // Group responses by module
  const groupedResponses = attempt.responses.reduce((acc: any, response: any) => {
    const modId = response.question.module.id;
    if (!acc[modId]) {
      acc[modId] = {
        id: modId,
        title: response.question.module.title,
        type: response.question.module.type,
        responses: [],
        total: 0,
        correct: 0,
        scoreSum: 0
      };
    }
    acc[modId].responses.push(response);
    acc[modId].total += 1;
    if (response.isCorrect) {
      acc[modId].correct += 1;
    }
    if (response.scoreValue != null) {
      acc[modId].scoreSum += response.scoreValue;
    }
    return acc;
  }, {});

  const modules = Object.values(groupedResponses) as any[];

  function toggleModule(modId: string) {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  }

  return (
    <div className="bg-[#f8f6f5] text-[#2D3142] min-h-screen font-sans">
      <div className="max-w-[900px] mx-auto px-6 py-10 pb-20">
        <Link href="/admin" className="text-sm font-bold text-[#fb6a51] hover:underline mb-6 inline-block">
          ← Back to Admin Dashboard
        </Link>
        
        {/* ─── Hero Banner from Results Page ─── */}
        <div className="bg-gradient-to-br from-[#fb6a51] to-[#f97316] rounded-3xl p-6 md:p-10 text-white text-center shadow-xl shadow-[#fb6a51]/20 mx-2 md:mx-0 mb-8">
          <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
            Student Result • {attempt.user.email}
          </p>
          <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
            🎯 {topMatch ? topMatch.occupationalProfile.title : "Pending"}
          </h1>
          {topMatch && (
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur rounded-full px-4 md:px-6 py-2 md:py-3 mt-4">
              <span className="text-lg md:text-2xl text-white font-extrabold">{Math.round(topMatch.fitmentPercentage)}%</span>
              <span className="text-white/80 text-xs md:text-sm font-semibold">Fitment Score</span>
            </div>
          )}
          <p className="text-white/80 text-[10px] md:text-xs mt-6 font-medium">
            Started: {format(new Date(attempt.startTime), "PPp")} • {attempt.responses.length} questions answered
          </p>
        </div>

        {resultsData && (
          <div className="flex flex-col gap-6 mb-10">
            {/* ─── Top Career Matches ─── */}
            {resultsData.careerMatches && resultsData.careerMatches.length > 0 && (
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900 mb-6">Top Career Matches</h2>
                <div className="flex flex-col gap-5">
                  {resultsData.careerMatches.map((match: any, i: number) => (
                    <div key={match.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center text-white`}
                            style={{ backgroundColor: MATCH_COLORS[i] }}>
                            {i + 1}
                          </span>
                          <p className="font-bold text-slate-900">{match.title}</p>
                        </div>
                      </div>
                      <FitmentBar pct={match.fitment} color={MATCH_COLORS[i]} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Radar Chart + Big 5 ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900 mb-4">Personality & Interest Radar</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={resultsData.radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    />
                    <Radar
                      name="Profile"
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
                  {Object.entries(resultsData.big5).map(([trait, score]) => (
                    <div key={trait} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{trait}</p>
                          <p className="text-xs text-slate-400">{BIG5_DESCRIPTORS[trait]}</p>
                        </div>
                        <span className="text-sm font-extrabold text-[#fb6a51]">{score as number}%</span>
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
            {resultsData.cognitiveBreakdown.some((c: any) => c.pct > 0) && (
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900 mb-6">Cognitive Aptitude</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {resultsData.cognitiveBreakdown.map((c: any) => (
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
          </div>
        )}

        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 mt-8">Detailed Responses by Module</h2>
        
        <div className="flex flex-col gap-5">
          {modules.map((mod) => {
            const isExpanded = !!expandedModules[mod.id];
            
            return (
              <div key={mod.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Module Header / Summary */}
                <button 
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-[#f8f6f5] transition-colors text-left"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-[#2D3142]">{mod.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-[#9095A7]">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {mod.type}
                      </span>
                      <span>Total Questions: <span className="font-bold text-[#2D3142]">{mod.total}</span></span>
                      
                      {(mod.type === "Cognitive" || mod.type === "SJT") ? (
                         <span>Correct: <span className="font-bold text-[#4CB944]">{mod.correct}</span></span>
                      ) : (
                         <span>Score Extracted: <span className="font-bold text-[#fb6a51]">{mod.scoreSum}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-50 text-slate-500 rounded-full font-bold text-sm border border-slate-100 group-hover:bg-slate-200 transition-colors">
                    {isExpanded ? 'Hide Questions ▲' : 'View Questions ▼'}
                  </div>
                </button>

                {/* Expanded Question List */}
                {isExpanded && (
                  <div className="border-t border-[#f4e8e6] bg-white w-full overflow-x-auto p-0">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#f4e8e6] text-[#9095A7] text-[11px] uppercase tracking-wider bg-slate-50">
                          <th className="px-6 py-4 font-semibold w-1/3">Question</th>
                          <th className="px-6 py-4 font-semibold">Trait / Polarity</th>
                          <th className="px-6 py-4 font-semibold">Student Answer</th>
                          <th className="px-6 py-4 font-semibold border-l border-slate-100">Score Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mod.responses.map((response: any) => (
                          <tr key={response.id} className="border-b border-slate-50 hover:bg-[#f8f6f5] transition-colors text-[13px]">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800 line-clamp-3">
                                {response.question.text}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-600">{response.question.traitDimension || "N/A"}</div>
                              {response.question.scoringPolarity && (
                                <div className="text-[11px] font-mono text-slate-400 mt-1">{response.question.scoringPolarity}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-[#fb6a51]">{response.answerText}</span>
                            </td>
                            <td className="px-6 py-4 border-l border-slate-100">
                              {mod.type === "Cognitive" || mod.type === "SJT" ? (
                                <span className={`px-2.5 py-1 rounded text-xs font-bold ${response.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {response.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              ) : (
                                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                  Score: {response.scoreValue ?? "N/A"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center">
             <p className="text-slate-400 font-medium">No responses recorded yet.</p>
          </div>
        )}

      </div>
    </div>
  );
}
