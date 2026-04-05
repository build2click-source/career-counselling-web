"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const features = [
  {
    emoji: "🧠",
    title: "No Test Fatigue",
    desc: "Emoji-anchored scales and a friendly design keep you motivated across all 246 questions.",
  },
  {
    emoji: "✨",
    title: "Deep Insights",
    desc: "Evaluates Big 5 personality, RIASEC interests, and cognitive aptitude using validated science.",
  },
  {
    emoji: "🎯",
    title: "Precise Matching",
    desc: "Euclidean distance scoring maps your profile to 900+ careers for an exact fitment score.",
  },
];

const modules = [
  { icon: "🧠", label: "Big 5 Personality", color: "bg-purple-100 text-purple-600" },
  { icon: "🎯", label: "RIASEC Interests", color: "bg-orange-100 text-orange-600" },
  { icon: "🧩", label: "Cognitive Aptitude", color: "bg-blue-100 text-blue-600" },
  { icon: "✨", label: "Work Values", color: "bg-green-100 text-green-600" },
  { icon: "🧭", label: "Situational Judgement", color: "bg-pink-100 text-pink-600" },
];

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [targetAsmt, setTargetAsmt] = (require('react').useState)(null);

  (require('react').useEffect)(() => {
    if (isLoggedIn) {
      fetch("/api/user-assessments")
        .then((r) => r.json())
        .then((data) => {
          if (data.assessments?.[0]) {
            const first = data.assessments[0];
            setTargetAsmt({
              id: first.id,
              status: first.status,
              attemptId: first.attemptId
            });
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn]);

  const assessmentLink = isLoggedIn 
    ? (targetAsmt 
        ? (targetAsmt.status === "COMPLETED" 
            ? (targetAsmt.attemptId ? `/results/${targetAsmt.attemptId}` : "/dashboard")
            : `/dashboard/${targetAsmt.id}`) 
        : "/dashboard") 
    : "/register";

  return (
    <div className="bg-[#f8f6f5] text-slate-900 font-sans min-h-screen">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* gradient blob bg */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#fb6a51]/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-3xl" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-28 flex flex-col items-center text-center gap-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fb6a51]/10 text-[#fb6a51] text-sm font-semibold border border-[#fb6a51]/20">
            🚀 Psychometric Assessment Platform
          </span>

          <h1 className="text-4xl md:text-7xl font-black leading-[1.05] tracking-tight max-w-4xl px-4">
            Discover Your{" "}
            <span className="text-[#fb6a51]">Career DNA</span>{" "}
            — Without the Fatigue
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            A comprehensive psychometric platform that evaluates your personality, interests, and cognitive strengths to precisely match you with the right career path.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link href={assessmentLink}>
              <button className="px-8 py-4 rounded-full bg-[#fb6a51] text-white font-bold text-base shadow-lg shadow-[#fb6a51]/30 hover:bg-[#e55b44] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
                Start Your Assessment →
              </button>
            </Link>
            {!isLoggedIn && (
              <Link href="/login">
                <button className="px-8 py-4 rounded-full bg-white text-slate-700 font-semibold text-base border border-slate-200 shadow-sm hover:border-[#fb6a51] hover:text-[#fb6a51] hover:-translate-y-0.5 transition-all">
                  I already have an account
                </button>
              </Link>
            )}
          </div>

          {/* social proof */}
          <p className="text-slate-400 text-sm mt-2">
            Based on validated frameworks: <span className="font-semibold text-slate-500">Big 5 · RIASEC · O*NET · VARK</span>
          </p>
        </div>
      </section>

      {/* ─── 5 MODULES STRIP ─── */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <p className="text-slate-400 text-sm font-medium mr-4 hidden md:block">5 Assessment Modules</p>
            {modules.map((m) => (
              <div key={m.label} className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${m.color}`}>{m.icon}</span>
                <span className="text-sm font-semibold text-slate-600">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-[1200px] mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            The Assessment Reimagined
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Designed for students and career transitioners who need deep psychological insights — without the clinical testing format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#f8f6f5] flex items-center justify-center text-4xl">
                {f.emoji}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-slate-900 text-white py-28">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg mb-16">Three steps from uncertainty to a clear career direction.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Complete 5 Science-Backed Modules", desc: "Take at your own pace. Save and resume within a 5-day window." },
              { step: "02", title: "AI Scores Your Psychometric Profile", desc: "Our Euclidean-distance engine maps you against 900+ O*NET careers." },
              { step: "03", title: "Get Your Career Fitment Report", desc: "Receive a ranked list with radar charts showing skill gaps and strengths." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#fb6a51] flex items-center justify-center text-[#fb6a51] font-black text-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-[1200px] mx-auto px-6 py-28">
        <div className="bg-[#fb6a51] rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-[#fb6a51]/30 mx-4 md:mx-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 relative z-10">
            Ready to find your Career DNA?
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto relative z-10">
            Join thousands of students and professionals who have discovered their ideal career path through science.
          </p>
          <Link href={assessmentLink}>
            <button className="relative z-10 px-10 py-4 rounded-full bg-white text-[#fb6a51] font-black text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
              {isLoggedIn ? "Continue Assessment →" : "Start Free Assessment →"}
            </button>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <span className="text-[#fb6a51] text-lg">◆</span> Career DNA
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms of Service</a>
          </div>
          <p>© 2026 Career DNA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
