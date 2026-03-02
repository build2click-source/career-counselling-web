"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResponseData {
    id: string;
    answerText: string;
    isCorrect: boolean;
    marksObtained: number;
    question: {
        text: string;
        correctAnswer: string;
        marks: number;
        options: string;
    }
}

interface AttemptDetail {
    id: string;
    exam: { title: string };
    createdAt: string;
    responses: ResponseData[];
}

export default function ResultDetails({ params }: { params: Promise<{ attemptId: string }> }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Unify React 19 param unwrap
    const unwrappedParams = use(params);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchAttemptDetails();
        }
    }, [status, router]);

    const fetchAttemptDetails = async () => {
        try {
            const res = await fetch(`/api/user-attempts/${unwrappedParams.attemptId}`);
            if (res.ok) {
                const data = await res.json();
                setAttempt(data);
            } else {
                router.push('/results');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !attempt) {
        return <div className="container" style={{ padding: '4rem 0' }}>Loading details...</div>;
    }

    const totalScore = attempt.responses.reduce((sum, r) => sum + r.marksObtained, 0);
    const maxScore = attempt.responses.reduce((sum, r) => sum + r.question.marks, 0);
    const accuracy = Math.round((totalScore / maxScore) * 100) || 0;

    return (
        <div className="container" style={{ padding: '3rem 0' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <Link href="/results" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>
                        ← Back to Results
                    </Link>
                    <h1 style={{ marginBottom: '0.5rem' }}>{attempt.exam.title} - Detailed Evaluation</h1>
                    <p>Taken on {new Date(attempt.createdAt).toLocaleString()}</p>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', minWidth: '200px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Score</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {totalScore} <span style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>/ {maxScore}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <span className={`badge ${accuracy >= 80 ? 'badge-success' : 'badge-warning'}`}>{accuracy}% Accuracy</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', marginTop: '1rem' }}>Response Breakdown</h2>

                {attempt.responses.map((resp, idx) => (
                    <div key={resp.id} className="glass-card" style={{ borderLeft: `4px solid ${resp.isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Question {idx + 1}</h3>
                            <span className={`badge ${resp.isCorrect ? 'badge-success' : 'badge-warning'}`} style={{ backgroundColor: resp.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: resp.isCorrect ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {resp.isCorrect ? 'Correct' : 'Incorrect'} ({resp.marksObtained} / {resp.question.marks} marks)
                            </span>
                        </div>

                        <p style={{ marginBottom: '1.5rem', fontSize: '1.05rem', color: 'var(--color-text-main)' }}>{resp.question.text}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Your Answer</span>
                                <span style={{ fontWeight: '500', color: resp.isCorrect ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {resp.answerText || <em>(Left blank)</em>}
                                </span>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Correct Answer</span>
                                <span style={{ fontWeight: '500', color: 'var(--color-success)' }}>{resp.question.correctAnswer}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
