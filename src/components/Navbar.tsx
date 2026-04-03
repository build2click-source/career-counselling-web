"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Hide navbar on login/register or assessment pages (Focus Mode)
  if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/assessment/")) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-6 md:size-8 text-[#fb6a51]">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#fb6a51] transition-colors truncate max-w-[100px] sm:max-w-none">
            Career DNA
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          {status === "loading" ? (
            <span className="text-slate-400 animate-pulse text-xs md:text-sm">...</span>
          ) : session ? (
            <>
              <div className="flex items-center gap-3 md:gap-6 mr-2 md:mr-4">
                {session.user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className={`text-[11px] md:text-sm font-semibold transition-colors ${
                      pathname === "/admin" ? "text-[#fb6a51]" : "text-slate-600 hover:text-[#fb6a51]"
                    }`}
                  >
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className={`text-[11px] md:text-sm font-semibold transition-colors ${
                        pathname?.startsWith("/dashboard") ? "text-[#fb6a51]" : "text-slate-600 hover:text-[#fb6a51]"
                      }`}
                    >
                      Assessments
                    </Link>
                    <Link
                      href="/results"
                      className={`text-[11px] md:text-sm font-semibold transition-colors ${
                        pathname === "/results" ? "text-[#fb6a51]" : "text-slate-600 hover:text-[#fb6a51]"
                      }`}
                    >
                      Results
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-md active:scale-95"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-600 hover:text-[#fb6a51] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-full bg-[#fb6a51] text-white text-sm font-bold shadow-sm hover:bg-[#e55b44] hover:shadow-md transition-all active:scale-95"
              >
                Start Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

