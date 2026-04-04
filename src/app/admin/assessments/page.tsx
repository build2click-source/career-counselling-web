"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ModuleInfo {
  id: string;
  title: string;
  type: string;
  order: number;
  isArchived: boolean;
  _count: { questions: number };
}

interface AssessmentInfo {
  id: string;
  title: string;
  description: string | null;
  timeLimitMinutes: number;
  isArchived: boolean;
  modules: ModuleInfo[];
  _count: { attempts: number };
}

const MODULE_TYPES = ["FFM", "RIASEC", "Cognitive", "Values", "SJT", "Custom"];

export default function ManageAssessmentsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form state for new assessment
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTime, setNewTime] = useState("60");
  const [newModules, setNewModules] = useState([{ title: "", type: "FFM" }]);
  const [saving, setSaving] = useState(false);

  // Expanded assessment cards
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state for adding module to existing assessment
  const [addModuleTitle, setAddModuleTitle] = useState("");
  const [addModuleType, setAddModuleType] = useState("FFM");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }
    loadAssessments();
  }, [authStatus, session, router]);

  function loadAssessments() {
    fetch("/api/admin/assessments")
      .then((r) => r.json())
      .then((data) => { setAssessments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const validModules = newModules.filter((m) => m.title.trim());
    const res = await fetch("/api/admin/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        timeLimitMinutes: Number(newTime),
        modules: validModules,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewTime("60");
      setNewModules([{ title: "", type: "FFM" }]);
      loadAssessments();
    }
    setSaving(false);
  }

  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its questions? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/modules/${moduleId}`, { method: "DELETE" });
    if (res.ok) loadAssessments();
  }

  async function handleDeleteAssessment(id: string) {
    if (!confirm("Are you sure you want to delete this assessment? Past attempts might be archived.")) return;
    const res = await fetch(`/api/admin/assessments/${id}`, { method: "DELETE" });
    if (res.ok) loadAssessments();
  }

  async function handleRestoreAssessment(id: string) {
    const res = await fetch(`/api/admin/assessments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false })
    });
    if (res.ok) loadAssessments();
  }

  async function handleRestoreModule(moduleId: string) {
    const res = await fetch(`/api/admin/modules/${moduleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false })
    });
    if (res.ok) loadAssessments();
  }

  async function handleAddModule(id: string) {
    const validTitle = addModuleTitle.trim();
    if (!validTitle) return;
    setSaving(true);
    const res = await fetch(`/api/admin/assessments/${id}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: validTitle, type: addModuleType })
    });
    if (res.ok) {
      setAddModuleTitle("");
      setAddModuleType("FFM");
      loadAssessments();
    }
    setSaving(false);
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading assessments…</div>
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
            href="/admin/assessments"
            className="px-5 py-2.5 rounded-full bg-[#fb6a51] text-white text-sm font-bold shadow-sm text-center"
          >
            Manage Assessments
          </Link>
          <Link
            href="/admin/profiles"
            className="px-5 py-2.5 rounded-full bg-white text-slate-600 text-sm font-bold border border-slate-200 hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all text-center"
          >
            Occupational Profiles
          </Link>
        </div>

        {/* ─── Header + Create button ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Assessment Library</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full md:w-auto px-6 py-3 rounded-full bg-[#fb6a51] text-white font-bold text-sm shadow-md hover:bg-[#e55b44] transition-all active:scale-95"
          >
            {showCreate ? "Cancel" : "+ New Assessment"}
          </button>
        </div>

        {/* ─── Create Form ─── */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8 flex flex-col gap-5">
            <h2 className="text-xl font-bold">Create New Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#9095A7] uppercase">Title *</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm"
                  placeholder="e.g. Career DNA — Full Assessment" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#9095A7] uppercase">Time Limit (min) *</label>
                <input type="number" value={newTime} onChange={(e) => setNewTime(e.target.value)} required min={1}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#9095A7] uppercase">Description</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm resize-none"
                placeholder="Optional description…" />
            </div>

            {/* Modules */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-[#9095A7] uppercase">Modules</label>
              {newModules.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input value={m.title} onChange={(e) => { const u = [...newModules]; u[i].title = e.target.value; setNewModules(u); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm"
                    placeholder="Module title" />
                  <select value={m.type} onChange={(e) => { const u = [...newModules]; u[i].type = e.target.value; setNewModules(u); }}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#fb6a51] focus:outline-none">
                    {MODULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {newModules.length > 1 && (
                    <button type="button" onClick={() => setNewModules(newModules.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-lg font-bold">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setNewModules([...newModules, { title: "", type: "FFM" }])}
                className="self-start text-sm font-bold text-[#fb6a51] hover:underline">+ Add Module</button>
            </div>

            <button type="submit" disabled={saving}
              className="self-end px-8 py-3 rounded-full bg-[#2D3142] text-white font-bold text-sm hover:bg-[#1a1e2e] transition-all disabled:opacity-50">
              {saving ? "Creating…" : "Create Assessment"}
            </button>
          </form>
        )}

        {/* ─── Assessment Cards ─── */}
        {assessments.length === 0 ? (
          <div className="text-center text-slate-400 py-16">No assessments yet. Create one above!</div>
        ) : (
          <div className="flex flex-col gap-6">
            {assessments.map((a) => (
              <div key={a.id} className={`bg-white rounded-2xl shadow-sm border ${a.isArchived ? "border-slate-300 opacity-60" : "border-slate-100"} overflow-hidden`}>
                {/* Header */}
                <div className="w-full flex items-start md:items-center justify-between p-5 md:p-6 hover:bg-[#f8f6f5] transition-colors text-left border-b border-transparent">
                  <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="flex-1 flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg md:text-xl font-bold ${a.isArchived ? "text-slate-500" : "text-[#2D3142]"}`}>{a.title}</h3>
                      {a.isArchived && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 uppercase">Archived</span>}
                    </div>
                    <p className="text-xs md:text-sm text-[#9095A7]">
                      {a.modules.length} modules · {a.timeLimitMinutes} min · {a._count.attempts} attempts
                    </p>
                  </button>
                  <div className="flex items-center gap-4">
                    {a.isArchived ? (
                      <button onClick={() => handleRestoreAssessment(a.id)} className="text-sm font-bold text-slate-600 hover:text-[#fb6a51] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                        Restore
                      </button>
                    ) : (
                      <button onClick={() => handleDeleteAssessment(a.id)} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                        Delete
                      </button>
                    )}
                    <span className={`text-xl md:text-2xl transition-transform duration-200 cursor-pointer ${expandedId === a.id ? "rotate-180" : ""}`} onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* Expanded: Module List */}
                {expandedId === a.id && (
                  <div className="border-t border-slate-100 px-4 md:px-6 pb-6 overflow-x-auto">
                    <table className="w-full mt-4 text-left min-w-[500px]">
                      <thead>
                        <tr className="text-[10px] md:text-xs text-[#9095A7] uppercase tracking-wider border-b border-slate-100">
                          <th className="pb-2 font-semibold">#</th>
                          <th className="pb-2 font-semibold">Module</th>
                          <th className="pb-2 font-semibold">Type</th>
                          <th className="pb-2 font-semibold">Questions</th>
                          <th className="pb-2 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.modules.map((m) => (
                          <tr key={m.id} className={`border-b border-slate-50 hover:bg-[#f8f6f5] transition-colors ${m.isArchived ? "opacity-50 grayscale" : ""}`}>
                            <td className="py-3 text-sm font-bold text-[#9095A7]">{m.order}</td>
                            <td className="py-3 font-bold text-[#2D3142]">
                              {m.title}
                              {m.isArchived && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-500 uppercase">Archived</span>}
                            </td>
                            <td className="py-3">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">{m.type}</span>
                            </td>
                            <td className="py-3 text-sm font-semibold text-[#2D3142]">{m._count.questions}</td>
                            <td className="py-3 text-right flex items-center justify-end gap-3">
                              <Link href={`/admin/assessments/${m.id}`}
                                className="text-sm font-bold text-[#fb6a51] hover:underline">
                                Edit Questions
                              </Link>
                              {m.isArchived ? (
                                <button onClick={() => handleRestoreModule(m.id)}
                                  className="text-sm font-bold text-slate-500 hover:text-[#fb6a51] transition-colors">
                                  Restore
                                </button>
                              ) : (
                                <button onClick={() => handleDeleteModule(m.id)}
                                  className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors">
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-6 flex flex-col gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="text-xs font-bold text-[#9095A7] uppercase">Add New Module</label>
                      <div className="flex items-center gap-3">
                        <input value={addModuleTitle} onChange={(e) => setAddModuleTitle(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm"
                          placeholder="Module title" />
                        <select value={addModuleType} onChange={(e) => setAddModuleType(e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#fb6a51] focus:outline-none bg-white">
                          {MODULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button type="button" disabled={saving || !addModuleTitle.trim()} onClick={() => handleAddModule(a.id)}
                          className="px-5 py-2.5 rounded-xl bg-[#2D3142] text-white font-bold text-sm shadow-sm hover:bg-[#1a1e2e] transition-all disabled:opacity-50">
                          {saving ? "..." : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
