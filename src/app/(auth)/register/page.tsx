"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // In a full implementation, you'd create a /api/auth/register endpoint.
            // For this spec, we seeded data, but let's just mock a quick UI redirection,
            // as creating a new raw user endpoint wasn't strictly asked but NextAuth allows it.
            // Assuming user creation logic is skipped for mock scope since we have a seeded account.
            setError("Registration endpoint needs to be wired up. Please use seeded users: student@ielts.com or admin@ielts.com (pass: student123/admin123)");
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h2>
                {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? "Creating..." : "Sign Up"}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Already have an account? <Link href="/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
                </p>
            </div>
        </div>
    );
}
