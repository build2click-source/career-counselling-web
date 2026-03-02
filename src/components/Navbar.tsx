"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link href="/" style={{ textDecoration: 'none', color: 'var(--color-text-main)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    IELTS Master
                </Link>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {status === "loading" ? (
                        <span>Loading...</span>
                    ) : session ? (
                        <>
                            {session.user.role === 'ADMIN' ? (
                                <Link href="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Admin Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Exams</Link>
                                    <Link href="/results" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Results</Link>
                                </>
                            )}
                            <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>{session.user.email}</span>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="btn btn-danger"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{ textDecoration: 'none', color: 'var(--color-text-muted)', fontWeight: '600' }}>Log in</Link>
                            <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
