"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AttemptRecord {
    id: string;
    isCompleted: boolean;
    createdAt: string;
    examId: string;
    exam: { title: string };
    user: { id: string; email: string };
    responses: { marksObtained: number; question: { marks: number } }[];
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session.user.role !== "ADMIN") {
                router.push("/dashboard");
            } else {
                fetchAdminAttempts();
            }
        }
    }, [status, router, session]);

    const fetchAdminAttempts = async () => {
        try {
            const res = await fetch('/api/admin/attempts');
            if (res.ok) {
                const data = await res.json();
                setAttempts(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading admin dashboard...</div>;

    // Group attempts by user
    const attemptsByUser = attempts.reduce((acc, attempt) => {
        if (!acc[attempt.user.email]) {
            acc[attempt.user.email] = [];
        }
        acc[attempt.user.email].push(attempt);
        return acc;
    }, {} as Record<string, AttemptRecord[]>);

    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                    <p>Teacher interface for managing exams and reviewing students.</p>
                </div>
                <Link href="/admin/exams/create" className="btn btn-primary">➕ Create New Exam</Link>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Student Submissions</h2>

            {Object.keys(attemptsByUser).length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No student attempts recorded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {Object.entries(attemptsByUser).map(([userEmail, userAttempts]) => (
                        <div key={userEmail} className="glass-card">
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                                👤 {userEmail}
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginLeft: '1rem', fontWeight: 'normal' }}>
                                    ({userAttempts.length} attempts)
                                </span>
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {userAttempts.map(att => {
                                    // Calculate simplified score (since the basic API for admin didn't aggressively deep fetch Question marks, we just show raw obtained for this view)
                                    const score = att.responses.reduce((sum, r) => sum + r.marksObtained, 0);

                                    return (
                                        <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{att.exam.title}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(att.createdAt).toLocaleString()}</div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                                <div className={`badge ${att.isCompleted ? 'badge-success' : 'badge-warning'}`}>
                                                    {att.isCompleted ? `Score: ${score}` : 'In Progress'}
                                                </div>
                                                {att.isCompleted && (
                                                    <Link href={`/admin/users/${att.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                                                        Full Review
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
