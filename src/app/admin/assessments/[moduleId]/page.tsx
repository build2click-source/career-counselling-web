"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface QuestionData {
  id: string;
  text: string;
  traitDimension: string | null;
  scoringPolarity: string | null;
  options: string;
  correctAnswer: string | null;
  marks: number;
}

interface ModuleData {
  id: string;
  title: string;
  type: string;
  order: number;
  assessmentId: string;
}

const EMPTY_Q = {
  text: "",
  traitDimension: "",
  scoringPolarity: "",
  options: '["Option 1","Option 2","Option 3","Option 4"]',
  correctAnswer: "",
  marks: "1",
};

export default function QuestionEditorPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [mod, setMod] = useState<ModuleData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [newQ, setNewQ] = useState({ ...EMPTY_Q });
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;
    if ((session?.user as any)?.role !== "ADMIN") { router.push("/dashboard"); return; }
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, session, router]);

  function loadQuestions() {
    fetch(`/api/admin/modules/${moduleId}/questions`)
      .then((r) => r.json())
      .then((data) => {
        setMod(data.module);
        setQuestions(data.questions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function startEdit(q: QuestionData) {
    setEditingId(q.id);
    setEditForm({
      text: q.text,
      traitDimension: q.traitDimension ?? "",
      scoringPolarity: q.scoringPolarity ?? "",
      options: q.options,
      correctAnswer: q.correctAnswer ?? "",
      marks: String(q.marks),
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/modules/${moduleId}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editForm, marks: Number(editForm.marks) }),
    });
    if (res.ok) {
      setEditingId(null);
      loadQuestions();
    }
    setSaving(false);
  }

  async function archiveQuestion(questionId: string) {
    if (!confirm("Archive this question? It will be hidden but student responses are preserved.")) return;
    const res = await fetch(`/api/admin/modules/${moduleId}/questions?questionId=${questionId}`, { method: "DELETE" });
    if (res.ok) loadQuestions();
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/admin/modules/${moduleId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: newQ.text,
        traitDimension: newQ.traitDimension || null,
        scoringPolarity: newQ.scoringPolarity || null,
        options: newQ.options,
        correctAnswer: newQ.correctAnswer || null,
        marks: Number(newQ.marks),
      }),
    });
    if (res.ok) {
      setNewQ({ ...EMPTY_Q });
      setShowAdd(false);
      loadQuestions();
    }
    setSaving(false);
  }

  async function bulkImport() {
    setSaving(true);
    try {
      const parsed = JSON.parse(bulkJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const res = await fetch(`/api/admin/modules/${moduleId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (res.ok) {
        setBulkJson("");
        setShowBulk(false);
        loadQuestions();
      }
    } catch {
      alert("Invalid JSON. Please paste a valid JSON array of question objects.");
    }
    setSaving(false);
  }

  function parseOptions(optStr: string): string[] {
    try { return JSON.parse(optStr); } catch { return [optStr]; }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="text-slate-400 text-lg font-medium animate-pulse">Loading questions…</div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F6] text-[#2D3142] min-h-screen font-sans">
      <div className="w-full max-w-[1100px] mx-auto px-6 pb-20">

        {/* ─── Breadcrumb ─── */}
        <div className="flex items-center gap-2 pt-6 pb-2 text-sm text-[#9095A7]">
          <Link href="/admin" className="hover:text-[#fb6a51] transition-colors">Admin</Link>
          <span>›</span>
          <Link href="/admin/assessments" className="hover:text-[#fb6a51] transition-colors">Assessments</Link>
          <span>›</span>
          <span className="text-[#2D3142] font-semibold">{mod?.title ?? "Module"}</span>
        </div>

        {/* ─── Header ─── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{mod?.title}</h1>
            <p className="text-xs md:text-sm text-[#9095A7] mt-1">
              Type: <span className="font-bold">{mod?.type}</span> · {questions.length} active questions
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <button onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }}
              className="flex-1 md:flex-none px-4 md:px-5 py-2.5 rounded-full bg-white text-slate-600 text-xs md:text-sm font-bold border border-slate-200 hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all">
              {showBulk ? "Cancel" : "Bulk"}
            </button>
            <button onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }}
              className="flex-[2] md:flex-none px-5 md:px-6 py-2.5 rounded-full bg-[#fb6a51] text-white font-bold text-xs md:text-sm shadow-md hover:bg-[#e55b44] transition-all active:scale-95">
              {showAdd ? "Cancel" : "+ Add"}
            </button>
          </div>
        </div>

        {/* ─── Bulk Import ─── */}
        {showBulk && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Bulk Import (JSON)</h2>
            <p className="text-xs text-[#9095A7]">
              Paste a JSON array of objects with: text, options (array), traitDimension, scoringPolarity, correctAnswer, marks
            </p>
            <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} rows={6}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm font-mono resize-none"
              placeholder='[{"text":"Sample question?","options":["A","B","C","D"],"traitDimension":"Extraversion","marks":1}]' />
            <button onClick={bulkImport} disabled={saving || !bulkJson.trim()}
              className="self-end px-6 py-2.5 rounded-full bg-[#2D3142] text-white font-bold text-sm hover:bg-[#1a1e2e] transition-all disabled:opacity-50">
              {saving ? "Importing…" : "Import"}
            </button>
          </div>
        )}

        {/* ─── Add Single Question Form ─── */}
        {showAdd && (
          <form onSubmit={addQuestion} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Add New Question</h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#9095A7] uppercase">Question Text *</label>
              <input value={newQ.text} onChange={(e) => setNewQ({ ...newQ, text: e.target.value })} required
                className="px-4 py-3 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none transition-colors text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#9095A7] uppercase">Trait Dimension</label>
                <input value={newQ.traitDimension} onChange={(e) => setNewQ({ ...newQ, traitDimension: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none text-sm"
                  placeholder="e.g. Extraversion" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#9095A7] uppercase">Scoring Polarity</label>
                <select value={newQ.scoringPolarity} onChange={(e) => setNewQ({ ...newQ, scoringPolarity: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none text-sm">
                  <option value="">None</option>
                  <option value="Positive (+)">Positive (+)</option>
                  <option value="Negative (-)">Negative (-)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#9095A7] uppercase">Marks</label>
                <input type="number" value={newQ.marks} onChange={(e) => setNewQ({ ...newQ, marks: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none text-sm" min={0.5} step={0.5} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#9095A7] uppercase">Options (JSON array) *</label>
              <input value={newQ.options} onChange={(e) => setNewQ({ ...newQ, options: e.target.value })} required
                className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none text-sm font-mono"
                placeholder='["Strongly Disagree","Disagree","Neutral","Agree","Strongly Agree"]' />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#9095A7] uppercase">Correct Answer (optional)</label>
              <input value={newQ.correctAnswer} onChange={(e) => setNewQ({ ...newQ, correctAnswer: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#fb6a51] focus:outline-none text-sm"
                placeholder="For cognitive/SJT questions only" />
            </div>
            <button type="submit" disabled={saving}
              className="self-end px-8 py-3 rounded-full bg-[#2D3142] text-white font-bold text-sm hover:bg-[#1a1e2e] transition-all disabled:opacity-50">
              {saving ? "Adding…" : "Add Question"}
            </button>
          </form>
        )}

        {/* ─── Questions Table ─── */}
        {questions.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
            No questions in this module. Add one above!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {editingId === q.id ? (
                  /* ─── Inline Edit Mode ─── */
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#9095A7]">
                      <span>#{idx + 1}</span>
                      <span className="ml-auto">Editing</span>
                    </div>
                    <input value={editForm.text} onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                      className="px-4 py-2.5 rounded-xl border border-[#fb6a51] focus:outline-none text-sm font-medium" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input value={editForm.traitDimension} onChange={(e) => setEditForm({ ...editForm, traitDimension: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs" placeholder="Trait Dimension" />
                      <select value={editForm.scoringPolarity} onChange={(e) => setEditForm({ ...editForm, scoringPolarity: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs">
                        <option value="">No polarity</option>
                        <option value="Positive (+)">Positive (+)</option>
                        <option value="Negative (-)">Negative (-)</option>
                      </select>
                      <input value={editForm.correctAnswer} onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-xs" placeholder="Correct Answer" />
                    </div>
                    <input value={editForm.options} onChange={(e) => setEditForm({ ...editForm, options: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono" placeholder="Options JSON" />
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                      <button onClick={saveEdit} disabled={saving}
                        className="px-5 py-2 rounded-full bg-[#4CB944] text-white text-xs font-bold hover:bg-[#3fa63a] disabled:opacity-50">
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── Display Mode ─── */
                  <div className="p-4 md:p-5 flex flex-col sm:flex-row items-start gap-4">
                    <span className="text-sm font-extrabold text-[#9095A7] mt-0.5 w-7 text-center shrink-0 hidden sm:block">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:hidden">
                        <span className="text-xs font-bold text-[#9095A7]">Question #{idx + 1}</span>
                      </div>
                      <p className="font-semibold text-[#2D3142] text-sm leading-relaxed">{q.text}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.traitDimension && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-bold">{q.traitDimension}</span>
                        )}
                        {q.scoringPolarity && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">{q.scoringPolarity}</span>
                        )}
                        {q.correctAnswer && (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">✓ {q.correctAnswer}</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold">
                          {parseOptions(q.options).length} options
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button onClick={() => startEdit(q)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-[#fb6a51] border border-[#fb6a51]/30 hover:bg-[#fb6a51]/5 transition-all">
                        Edit
                      </button>
                      <button onClick={() => archiveQuestion(q.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-red-400 border border-red-200 hover:bg-red-50 transition-all">
                        Archive
                      </button>
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
