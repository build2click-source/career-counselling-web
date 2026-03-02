"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Attempt {
    id: string;
    isCompleted: boolean;
    createdAt: string;
    exam: { title: string };
    responses: { marksObtained: number }[];
}

export default function Results() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchMyAttempts();
        }
    }, [status, router]);

    const fetchMyAttempts = async () => {
        try {
            // Re-using the admin endpoint would require admin role. 
            // We need a specific endpoint for student's own attempts or filter via a generic one.
            // Let's create a quick API fetcher here to a new user-attempts route.
            const res = await fetch('/api/user-attempts');
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

    if (loading) return <div className="container" style={{ padding: '4rem 0' }}>Loading results...</div>;

    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: 0 }}>My Exam Results</h1>
                <Link href="/dashboard" className="btn btn-secondary">Back to Exams</Link>
            </div>

            {attempts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center' }}>
                    <p>You haven't completed any exams yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {attempts.map((att) => {
                        const totalScore = att.responses.reduce((sum, r) => sum + r.marksObtained, 0);
                        return (
                            <div key={att.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{att.exam.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                        Taken on: {new Date(att.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>Total Score</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalScore} <span style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>marks</span></span>
                                    </div>
                                    <Link href={`/results/${att.id}`} className="btn btn-primary">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
