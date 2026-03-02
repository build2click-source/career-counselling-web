"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exam {
    id: string;
    title: string;
    description: string;
    timeLimitMinutes: number;
    _count: { sections: number };
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session.user.role === "ADMIN") {
                router.push("/admin");
            } else {
                fetchExams();
            }
        }
    }, [status, router, session]);

    const fetchExams = async () => {
        try {
            const res = await fetch('/api/exams');
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Student Dashboard</h1>
                    <p>Welcome back, {session?.user?.email}</p>
                </div>
                <Link href="/results" className="btn btn-secondary">View My Results</Link>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Available Practice Tests</h2>

            {exams.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No exams are currently available.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {exams.map((exam) => (
                        <div key={exam.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{exam.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{exam.description || 'No description provided.'}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', fontSize: '0.85rem' }}>
                                <span className="badge badge-success">⏱️ {exam.timeLimitMinutes} mins</span>
                                <span className="badge badge-warning">📚 {exam._count.sections} Sections</span>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <Link href={`/exams/${exam.id}/take`} className="btn btn-primary" style={{ width: '100%' }}>
                                    Start Test Now
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
