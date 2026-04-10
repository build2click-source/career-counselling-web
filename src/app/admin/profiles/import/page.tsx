"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ONetSearchResult {
  occupation: {
    code: string;
    title: string;
    tags: {
      bright_outlook: boolean;
      green: boolean;
    };
  };
}

interface PreviewData {
  title: string;
  description: string;
  targetVector: number[];
  scores: any;
}

export default function ONetImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<ONetSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [saving, setSaving] = useState(false);
  const [secretKey, setSecretKey] = useState("");

  const dimensionKeys = [
    "Extraversion", "Agreeableness", "Conscientiousness", "Neuroticism", "Openness",
    "Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional",
    "Numerical Reasoning", "Verbal Reasoning", "Logical Reasoning"
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/onet/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setResults(data.occupation || []);
    } catch (err) {
      alert("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (code: string) => {
    setLoadingDetails(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/onet/details?code=${code}`);
      const data = await res.json();
      setPreview(data);
    } catch (err) {
      alert("Failed to fetch details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleVectorChange = (index: number, val: number) => {
    if (!preview) return;
    const newVector = [...preview.targetVector];
    newVector[index] = val;
    setPreview({ ...preview, targetVector: newVector });
  };

  const handleSave = async () => {
    if (!preview) return;
    if (secretKey !== "2326") {
      alert("Invalid secret key. Cannot import profile.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: preview.title,
          description: preview.description,
          targetVector: preview.targetVector
        }),
      });
      if (res.ok) router.push("/admin/profiles");
      else alert("Failed to save profile");
    } catch (err) {
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F4F7F6] text-[#2D3142] min-h-screen font-sans pb-20">
      <div className="w-full max-w-[1200px] mx-auto px-6 pt-10">
        <Link href="/admin/profiles" className="text-[#fb6a51] font-bold flex items-center gap-2 mb-8 hover:translate-x-[-4px] transition-transform w-fit">
          ← Back to Profiles
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Career Import</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* SEARCH SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                placeholder="Search careers (e.g. Architect)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-sm border border-slate-200 focus:border-[#fb6a51] focus:ring-4 focus:ring-[#fb6a51]/5 outline-none transition-all"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#fb6a51] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button disabled={searching} className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all">
                {searching ? "..." : "Find"}
              </button>
            </form>

            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
              {results.length > 0 ? (
                results.map((r, i) => (
                  <button
                    key={r.occupation.code}
                    onClick={() => handleSelect(r.occupation.code)}
                    className="w-full text-left p-4 rounded-2xl hover:bg-[#fb6a51]/5 group transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-[#fb6a51] transition-colors line-clamp-1">{r.occupation.title}</p>
                      <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">{r.occupation.code}</span>
                    </div>
                    <svg className="size-4 text-slate-200 group-hover:text-[#fb6a51] transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                  <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm italic">Search categories to see potential career candidates.</p>
                </div>
              )}
            </div>
          </div>

          {/* PREVIEW PANEL */}
          <div className="lg:col-span-8">
            {loadingDetails ? (
              <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center justify-center space-y-6 shadow-sm border border-slate-100 h-full">
                <div className="size-12 border-4 border-[#fb6a51] border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-medium">Fetching multi-source descriptors...</p>
              </div>
            ) : preview ? (
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col gap-10 animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-4xl font-extrabold text-[#2D3142]">{preview.title}</h2>
                    <textarea 
                      className="w-full p-4 rounded-2xl bg-slate-50 text-slate-600 text-sm leading-relaxed border-none focus:ring-2 focus:ring-[#fb6a51]/20 outline-none"
                      rows={3}
                      value={preview.description}
                      onChange={(e) => setPreview({ ...preview, description: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-3 items-end">
                    <input
                      type="password"
                      placeholder="Enter 4-digit key"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#fb6a51] focus:ring-2 focus:ring-[#fb6a51]/20 outline-none text-center tracking-widest text-[#2D3142] font-semibold"
                      maxLength={4}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving || secretKey.length !== 4}
                      className="w-full px-8 py-4 rounded-2xl bg-[#fb6a51] text-white font-bold shadow-lg shadow-[#fb6a51]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? "Creating Profile..." : "Add to Profiles"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  {dimensionKeys.map((k, i) => {
                    const val = preview.targetVector[i];
                    const isCognitive = k.includes("Reasoning");
                    return (
                      <div key={k} className="space-y-2 group">
                        <div className="flex justify-between items-center text-xs font-bold text-[#9095A7] uppercase tracking-widest">
                          <span className={isCognitive ? "text-indigo-500" : "group-hover:text-[#fb6a51] transition-colors"}>{k}</span>
                          <span className="text-[#2D3142] font-black">{val.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={isCognitive ? "1" : "5"}
                          step="0.1"
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#fb6a51]"
                          value={val}
                          onChange={(e) => handleVectorChange(i, parseFloat(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 flex gap-4 items-start">
                  <div className="p-2 rounded-xl bg-white shadow-sm text-indigo-500">
                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs leading-relaxed text-indigo-900/60">
                    <strong>Mapper Logic Applied:</strong> We have synthesized Interests, Work Styles, and Basic Abilities to form this 14-point vector. 
                    Cognitive scores are scaled 0–1, while Personality and Social dimensions are scaled 0–5. Use the sliders to manually refine the "Ideal Profile" before saving.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 h-full flex flex-col items-center justify-center gap-6">
                <div className="size-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                  <svg className="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-600 mb-2">Ready to Import</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto italic">Select an occupation from the left sidebar to preview its psychometric mapping and save it to your career marketplace.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
