"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Question {
    id: string;
    text: string;
    options: string;
    marks: number;
    audioUrl?: string;
    imageUrl?: string;
}

interface QuestionGroup {
    id: string;
    type: string;
    context?: string;
    audioUrl?: string;
    imageUrl?: string;
    questions: Question[];
}

interface Section {
    id: string;
    title: string;
    questionGroups: QuestionGroup[];
}

interface ExamStructure {
    id: string;
    title: string;
    timeLimitMinutes: number;
    sections: Section[];
}

export default function TakeExam({ params }: { params: Promise<{ id: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [exam, setExam] = useState<ExamStructure | null>(null);
    const [loading, setLoading] = useState(true);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Unify React 19 param unwrap
    const unwrappedParams = use(params);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchExamAndStartAttempt();
        }
    }, [status, router]);

    useEffect(() => {
        if (timeLeft > 0 && !submitting) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else if (timeLeft === 0 && attemptId && !submitting) {
            // Auto submit on time up
            handleSubmit();
        }
    }, [timeLeft, submitting, attemptId]);

    const fetchExamAndStartAttempt = async () => {
        try {
            // Fetch exam details
            const exRes = await fetch(`/api/exams/${unwrappedParams.id}`);
            if (!exRes.ok) throw new Error("Failed to fetch exam");
            const exData = await exRes.json();
            setExam(exData);
            setTimeLeft(exData.timeLimitMinutes * 60);

            // Start attempt
            const attRes = await fetch('/api/attempts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId: exData.id })
            });
            if (!attRes.ok) throw new Error("Failed to start attempt");
            const attData = await attRes.json();
            setAttemptId(attData.id);

        } catch (error) {
            console.error(error);
            alert("Error loading exam");
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionChange = (questionId: string, value: string) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (submitting || !attemptId) return;
        setSubmitting(true);

        // Format responses array
        const formattedResponses = Object.entries(responses).map(([questionId, answerText]) => ({
            questionId,
            answerText
        }));

        try {
            const res = await fetch('/api/attempts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attemptId, responses: formattedResponses })
            });

            if (res.ok) {
                alert("Exam submitted successfully!");
                router.push(`/results/${attemptId}`);
            } else {
                throw new Error("Failed to submit");
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting exam. Please try again.");
            setSubmitting(false);
        }
    };

    if (loading || !exam) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <p>Loading exam environment...</p>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentSection = exam.sections[currentSectionIdx];

    return (
        <div className="container" style={{ padding: '3rem 0' }}>

            {/* Header Sticky Bar */}
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '80px', zIndex: 40, marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{exam.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Section {currentSectionIdx + 1} of {exam.sections.length}</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 300 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </div>

            {/* Section Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {exam.sections.map((sec, idx) => (
                    <button
                        key={sec.id}
                        onClick={() => setCurrentSectionIdx(idx)}
                        className={`btn ${idx === currentSectionIdx ? 'btn-secondary' : ''}`}
                        style={{
                            background: idx === currentSectionIdx ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            border: '1px solid rgba(0,0,0,0.1)',
                            color: idx === currentSectionIdx ? 'var(--color-primary)' : 'var(--color-text-muted)'
                        }}
                    >
                        {sec.title}
                    </button>
                ))}
            </div>

            {/* Current Section Content */}
            <div className="animate-fade-in" key={currentSection.id}>
                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>
                    {currentSection.title}
                </h3>

                {currentSection.questionGroups.map((group, gIdx) => (
                    <div key={group.id} className="glass-card" style={{ marginBottom: '2rem' }}>

                        {/* Group Context (Audio/Passage) */}
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Questions {gIdx + 1} - {group.type}</h4>

                            {group.context && <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{group.context}</p>}

                            {group.audioUrl && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <audio controls src={group.audioUrl} style={{ width: '100%' }}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}

                            {group.imageUrl && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <img src={group.imageUrl} alt="Context Reference" style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)' }} />
                                </div>
                            )}
                        </div>

                        {/* Questions in the group */}
                        <div>
                            {group.questions.map((q, qIdx) => {
                                const options = JSON.parse(q.options || "[]");
                                const isFillInBlanks = options.length === 0;

                                return (
                                    <div key={q.id} style={{ marginBottom: '2rem', paddingLeft: '1rem', borderLeft: '3px solid var(--color-primary-hover)' }}>
                                        <p style={{ fontWeight: '600', marginBottom: '1rem' }}>Q: {q.text}</p>

                                        {q.audioUrl && (
                                            <audio controls src={q.audioUrl} style={{ width: '100%', marginBottom: '1rem' }} />
                                        )}

                                        {q.imageUrl && (
                                            <img src={q.imageUrl} alt="Question Reference" style={{ maxWidth: '100%', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }} />
                                        )}

                                        {isFillInBlanks ? (
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Type your answer here..."
                                                value={responses[q.id] || ''}
                                                onChange={(e) => handleOptionChange(q.id, e.target.value)}
                                                style={{ maxWidth: '400px' }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {options.map((opt: string, idx: number) => {
                                                    // Allow image URLs in options
                                                    const isOptImage = opt.startsWith('http') && (opt.endsWith('.png') || opt.endsWith('.jpg') || opt.endsWith('.jpeg'));
                                                    return (
                                                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                                            <input
                                                                type="radio"
                                                                name={q.id}
                                                                value={opt}
                                                                checked={responses[q.id] === opt}
                                                                onChange={(e) => handleOptionChange(q.id, e.target.value)}
                                                                style={{ transform: 'scale(1.2)' }}
                                                            />
                                                            {isOptImage ? (
                                                                <img src={opt} alt="Option target" style={{ height: '60px', borderRadius: 'var(--radius-sm)' }} />
                                                            ) : (
                                                                <span>{opt}</span>
                                                            )}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
}
