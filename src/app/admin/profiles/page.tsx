"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  title: string;
  description: string;
  targetVector: string;
}

export default function AdminProfilesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }

    fetch("/api/admin/profiles")
      .then((r) => r.json())
      .then((data) => { setProfiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, session, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      const res = await fetch(`/api/admin/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) setProfiles(profiles.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete profile");
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading profiles…</div>
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
            className="px-5 py-2.5 rounded-full bg-white text-slate-600 text-sm font-bold border border-slate-200 hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all text-center"
          >
            Overview
          </Link>
          <Link
            href="/admin/profiles"
            className="px-5 py-2.5 rounded-full bg-[#fb6a51] text-white text-sm font-bold shadow-sm text-center"
          >
            Occupational Profiles
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#2D3142]">Career Profiles</h2>
          <Link
            href="/admin/profiles/import"
            className="px-6 py-3 rounded-full bg-[#fb6a51] text-white font-bold shadow-md hover:bg-[#e55b44] transition-all active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Import from O*NET
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[#2D3142] pr-4">{p.title}</h3>
                  <div className="flex gap-1 shrink-0 bg-slate-50 p-1 rounded-xl">
                    <Link
                      href={`/admin/profiles/${p.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-lg transition-colors"
                      title="Edit Profile"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                      title="Delete Profile"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-[#9095A7] text-sm line-clamp-3 mb-4">{p.description}</p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold text-[#fb6a51] uppercase tracking-widest px-2 py-0.5 bg-[#fb6a51]/10 rounded">
                  {JSON.parse(p.targetVector).length} Dimensions
                </span>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-medium italic">No profiles found. Start by importing from O*NET.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
