"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface ProfileData {
  id: string;
  title: string;
  description: string;
  targetVector: number[];
}

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const dimensionKeys = [
    "Extraversion", "Agreeableness", "Conscientiousness", "Neuroticism", "Openness",
    "Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional",
    "Numerical Reasoning", "Verbal Reasoning", "Logical Reasoning"
  ];

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }

    if (profileId) {
      fetch(`/api/admin/profiles/${profileId}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error) {
            setProfile({
               ...data,
               targetVector: typeof data.targetVector === "string" ? JSON.parse(data.targetVector) : data.targetVector
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session, router, profileId]);

  const handleVectorChange = (index: number, val: number) => {
    if (!profile) return;
    const newVector = [...profile.targetVector];
    newVector[index] = val;
    setProfile({ ...profile, targetVector: newVector });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile.id,
          title: profile.title,
          description: profile.description,
          targetVector: profile.targetVector
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

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-bold">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400 font-bold">Profile not found.</div>
        <Link href="/admin/profiles" className="text-[#fb6a51] font-bold">← Back</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F6] text-[#2D3142] min-h-screen font-sans pb-20">
      <div className="w-full max-w-[1000px] mx-auto px-6 pt-10">
        <Link href="/admin/profiles" className="text-[#fb6a51] font-bold flex items-center gap-2 mb-8 hover:translate-x-[-4px] transition-transform w-fit">
          ← Back to Profiles
        </Link>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-8">Edit Career Profile</h1>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col gap-10 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4 flex-1 w-full">
              <input
                className="w-full p-4 text-3xl font-extrabold text-[#2D3142] rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#fb6a51]/20 transition-shadow"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              />
              <textarea 
                className="w-full p-4 rounded-2xl bg-slate-50 text-slate-600 text-sm leading-relaxed border-none focus:ring-2 focus:ring-[#fb6a51]/20 outline-none transition-shadow"
                rows={4}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-4 rounded-3xl bg-[#fb6a51] text-white font-bold shadow-lg shadow-[#fb6a51]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0 md:mt-4 w-full md:w-auto"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 pt-4 border-t border-slate-100">
            {dimensionKeys.map((k, i) => {
              const val = profile.targetVector[i];
              const isCognitive = k.includes("Reasoning");
              return (
                <div key={k} className="space-y-2 group">
                  <div className="flex justify-between items-center text-xs font-bold text-[#9095A7] uppercase tracking-widest">
                    <span className={isCognitive ? "text-indigo-500" : "group-hover:text-[#fb6a51] transition-colors"}>{k}</span>
                    <span className="text-[#2D3142] font-black">{val?.toFixed(1)}</span>
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
        </div>
      </div>
      <style jsx>{`
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
