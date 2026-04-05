"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  traitDimension: string | null;
  scoringPolarity: string | null;
  options: string[];
  correctAnswer: string | null;
  marks: number;
}

interface ModuleData {
  moduleId: string;
  assessmentId: string;
  title: string;
  type: string;
  order: number;
  questions: Question[];
}

const EMOJI_MAPS: Record<string, string[]> = {
  likert: ["😞", "🙁", "😐", "🙂", "🤩"],
  riasec: ["😣", "🙁", "😐", "🙂", "🤩"],
  values: ["😶", "😕", "😐", "🙂", "⭐"],
};

function getEmojiSet(type: string): string[] {
  if (type === "RIASEC") return EMOJI_MAPS.riasec;
  if (type === "Values") return EMOJI_MAPS.values;
  return EMOJI_MAPS.likert;
}

export default function AssessmentEnginePage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const moduleType = (params?.moduleId as string) ?? "FFM";

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // questionId → score (1-5)
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    setLoading(true);

    // 1. Fetch module questions
    fetch(`/api/assessment/module/${moduleType}/questions`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setModuleData(data);

        // 2. Start or resume an attempt tied to this specific module's assessment
        if (data.assessmentId) {
          const attemptRes = await fetch("/api/attempt/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assessmentId: data.assessmentId }),
          });
          const attemptData = await attemptRes.json();
          if (attemptData.attemptId) {
            setAttemptId(attemptData.attemptId);

            // 3. Load saved progress for this module
            setResuming(true);
            const progressRes = await fetch(
              `/api/attempt/progress?attemptId=${attemptData.attemptId}&moduleId=${data.moduleId}`
            );
            const progressData = await progressRes.json();

            if (progressData.answeredMap) {
              const savedAnswers = progressData.answeredMap as Record<string, number>;
              
              let localAnswers: Record<string, number> = {};
              try {
                const lsRaw = localStorage.getItem(`assessment_buffer_${attemptData.attemptId}`);
                if (lsRaw) localAnswers = JSON.parse(lsRaw);
              } catch (e) {}

              const mergedAnswers = { ...savedAnswers, ...localAnswers };
              setAnswers(mergedAnswers);

              // Find the first unanswered question to resume from
              const questions = data.questions as Question[];
              let resumeIdx = questions.length; // default: all done
              for (let i = 0; i < questions.length; i++) {
                if (mergedAnswers[questions[i].id] === undefined) {
                  resumeIdx = i;
                  break;
                }
              }
              setCurrentIdx(resumeIdx);
            }
            setResuming(false);
          }
        }

        setLoading(false);
      })
      .catch(() => { setError("Failed to load questions."); setLoading(false); });
  }, [status, moduleType, router]);

  const totalQuestions = moduleData?.questions.length ?? 0;
  const currentQuestion = moduleData?.questions[currentIdx];
  const progressPct = totalQuestions > 0 ? Math.round(((currentIdx) / totalQuestions) * 100) : 0;
  const isMultipleChoice = !!currentQuestion?.correctAnswer &&
    (moduleData?.type === "Cognitive" || moduleData?.type === "SJT");

  const syncAnswers = useCallback(async (currentAnswersObj: Record<string, number>) => {
    if (!attemptId || !moduleData) return;
    
    // Map current react state to question elements for backend submission
    const responsesPayload = Object.entries(currentAnswersObj)
      .map(([qId, score]) => {
        const q = moduleData.questions.find((x) => x.id === qId);
        if (!q) return null;
        return {
          attemptId,
          questionId: qId,
          answerText: q.options[score - 1] ?? String(score),
          scoreValue: score
        };
      })
      .filter(Boolean);

    if (responsesPayload.length === 0) return;

    try {
      await fetch("/api/attempt/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: responsesPayload }),
      });
      localStorage.removeItem(`assessment_buffer_${attemptId}`);
    } catch (err) {
      console.error("Failed to sync", err);
    }
  }, [attemptId, moduleData]);

  const handleSelect = useCallback((score: number) => {
    if (!currentQuestion) return;
    setSelectedScore(score);

    const newAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(newAnswers);

    // Buffer to localStorage
    if (attemptId) {
       try {
         const existing = JSON.parse(localStorage.getItem(`assessment_buffer_${attemptId}`) || "{}");
         existing[currentQuestion.id] = score;
         localStorage.setItem(`assessment_buffer_${attemptId}`, JSON.stringify(existing));
       } catch(e) {}
    }

    setSaving(true);
    setTimeout(async () => {
      setSaving(false);
      setSelectedScore(null);
      if (currentIdx < totalQuestions - 1) {
        setCurrentIdx((i) => i + 1);
      } else {
        setSaving(true);
        await syncAnswers(newAnswers);
        router.push(moduleData?.order === 5 ? "/results" : "/dashboard");
      }
    }, 350);
  }, [currentQuestion, answers, attemptId, currentIdx, totalQuestions, moduleData, router, syncAnswers]);

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setSelectedScore(null);
    }
  };

  const handleNext = useCallback(async () => {
    if (!currentQuestion || answers[currentQuestion.id] === undefined) return;
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedScore(null);
    } else {
      setSaving(true);
      await syncAnswers(answers);
      router.push(moduleData?.order === 5 ? "/results" : "/dashboard");
    }
  }, [currentIdx, totalQuestions, moduleData, router, currentQuestion, answers, syncAnswers]);

  // Pause & Save: bulk ship cached progress then navigate to dashboard
  const handlePauseAndSave = useCallback(async () => {
    setSaving(true);
    await syncAnswers(answers);
    setSaving(false);
    router.push("/dashboard");
  }, [router, answers, syncAnswers]);

  // ─── Loading / Error states ───────────────────────────────────────────────
  if (status === "loading" || loading || resuming) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex flex-col items-center justify-center gap-3">
        <div className="text-slate-400 text-lg font-medium animate-pulse">
          {resuming ? "Resuming your progress…" : "Loading questions…"}
        </div>
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-semibold">{error ?? "Module not found."}</p>
        <Link href="/dashboard" className="text-[#fb6a51] underline">← Back to Dashboard</Link>
      </div>
    );
  }

  // ─── Completion screen ────────────────────────────────────────────────────
  if (currentIdx >= totalQuestions) {
    return (
      <div className="min-h-screen bg-[#f8f6f5] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-extrabold text-slate-900">Module Complete!</h1>
        <p className="text-slate-500">You've answered all {totalQuestions} questions in <strong>{moduleData.title}</strong>.</p>
        <Link href="/dashboard">
          <button className="px-8 py-3 rounded-full bg-[#fb6a51] text-white font-bold shadow-md hover:bg-[#e55b44] transition-all">
            Back to Dashboard →
          </button>
        </Link>
      </div>
    );
  }

  const emojis = getEmojiSet(moduleData.type);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f6f5] font-sans">

      {/* ─── Sticky Top Bar ─── */}
      <div className="w-full bg-white border-b border-[#f4e8e6] sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto">
          <header className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 md:h-[72px] gap-4 md:gap-0">
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/dashboard">
                <button
                  className="flex cursor-pointer items-center justify-center rounded-full h-9 md:h-10 px-4 md:px-6 bg-[#f4e8e6] hover:bg-[#e9d2ce] transition-colors text-[#2D3142] text-xs md:text-sm font-bold"
                >
                  Back
                </button>
              </Link>

              <button
                onClick={handlePauseAndSave}
                className="md:hidden flex cursor-pointer items-center justify-center rounded-full h-9 px-4 bg-[#f4e8e6] hover:bg-[#e9d2ce] transition-colors text-[#2D3142] text-xs font-bold"
              >
                {saving ? "Saving…" : "Pause & Save"}
              </button>
            </div>

            <div className="flex-1 w-full max-w-md md:mx-8 flex flex-col gap-1.5 order-last md:order-none">
              <div className="flex justify-between items-end px-1">
                <p className="text-[10px] font-bold text-[#2D3142] uppercase tracking-wider">
                  {moduleData.title}
                </p>
                <p className="text-sm font-bold text-[#2D3142]">
                  {currentIdx + 1} / {totalQuestions}
                </p>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4CB944] transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <button
              onClick={handlePauseAndSave}
              className="hidden md:flex cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-[#f4e8e6] hover:bg-[#e9d2ce] transition-colors text-[#2D3142] text-sm font-bold"
            >
              {saving ? "Saving…" : "Pause & Save"}
            </button>
          </header>
        </div>
      </div>

      {/* ─── Question Card ─── */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-12">
        <div
          key={currentQuestion?.id}
          className="w-full max-w-[600px] bg-white rounded-[32px] shadow-sm p-6 md:p-14 flex flex-col items-center gap-6 md:gap-10"
          style={{ animation: "fadeIn 0.25s ease-out" }}
        >
          {/* Trait badge */}
          {currentQuestion?.traitDimension && (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {currentQuestion.traitDimension}
            </span>
          )}

          {/* Question text */}
          <h2 className="text-[#2D3142] text-xl md:text-3xl font-bold leading-tight text-center">
            {currentQuestion?.text}
          </h2>

          {/* ─── Likert scale (Personality / RIASEC / Values) ─── */}
          {!isMultipleChoice && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="flex justify-between w-full max-w-[380px]">
                {emojis.map((emoji, i) => {
                  const score = i + 1;
                  const isSelected = selectedScore === score ||
                    (currentQuestion && answers[currentQuestion.id] === score);
                  return (
                    <button
                      key={i}
                      aria-label={currentQuestion?.options[i] ?? `Option ${score}`}
                      onClick={() => handleSelect(score)}
                      title={currentQuestion?.options[i]}
                      className={`w-[52px] h-[52px] md:w-[62px] md:h-[62px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-[#fb6a51] border-[#fb6a51] scale-110 shadow-lg shadow-[#fb6a51]/30"
                          : "bg-white border-slate-200 hover:border-[#fb6a51] hover:-translate-y-1 hover:shadow-md"
                      }`}
                    >
                      <span className="text-2xl md:text-3xl">{emoji}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between w-full max-w-[380px] px-1 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>{currentQuestion?.options[0]}</span>
                <span>{currentQuestion?.options[4]}</span>
              </div>
            </div>
          )}

          {/* ─── Multiple choice (Cognitive / SJT) ─── */}
          {isMultipleChoice && (
            <div className="w-full flex flex-col gap-3">
              {currentQuestion?.options.map((opt, i) => {
                const isSelected = selectedScore === i + 1 ||
                  (currentQuestion && answers[currentQuestion.id] === i + 1);
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i + 1)}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-2 font-medium text-sm transition-all duration-200 ${
                      isSelected
                        ? "bg-[#fb6a51] border-[#fb6a51] text-white shadow-md"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-[#fb6a51] hover:bg-[#fb6a51]/5 hover:-translate-y-0.5"
                    }`}
                  >
                    <span className="font-bold mr-3 text-slate-400">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── Navigation Buttons ─── */}
          <div className="w-full flex items-center justify-between mt-4 gap-3">
            <button
              onClick={handleBack}
              disabled={currentIdx === 0}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-full border-2 border-slate-200 text-slate-500 font-bold text-xs md:text-sm hover:border-[#fb6a51] hover:text-[#fb6a51] transition-all disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
            >
              Previous
            </button>

            {currentQuestion && answers[currentQuestion.id] !== undefined && selectedScore === null && (
              <button
                onClick={handleNext}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-8 py-3 rounded-full font-bold text-xs md:text-sm shadow-md transition-all bg-[#fb6a51] text-white hover:bg-[#e55b44] hover:shadow-lg active:scale-95"
              >
                {currentIdx === totalQuestions - 1 ? "Finish Module" : "Next"}
              </button>
            )}
          </div>

        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
