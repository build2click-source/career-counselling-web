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
          <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 group-hover:text-[#fb6a51] transition-all duration-300 truncate max-w-[100px] sm:max-w-none">
            Career DNA
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          {status === "loading" ? (
            <span className="text-slate-400 animate-pulse text-xs md:text-sm">...</span>
          ) : session ? (
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm font-medium text-slate-600">
              {/* Take the Test Link */}
              <Link
                href="/dashboard"
                className={`transition-all duration-300 hover:text-[#fb6a51] ${
                  pathname?.startsWith("/dashboard") ? "text-[#fb6a51]" : "text-slate-600"
                }`}
              >
                Take the Test
              </Link>

              {/* Separator */}
              <span className="text-slate-200 hidden sm:inline">|</span>

              {/* Admin Link (Only for Admins) */}
              {session.user.role === "ADMIN" && (
                <>
                  <Link
                    href="/admin"
                    className="text-[#fb6a51] font-bold hover:text-[#e55b44] transition-all duration-300"
                  >
                    Admin
                  </Link>
                  <span className="text-slate-200 hidden sm:inline">|</span>
                </>
              )}

              {/* User Greeting */}
              <div className="flex items-center gap-1.5 px-1 py-1 rounded-lg group/user cursor-default">
                <svg
                  className="size-4 text-slate-400 group-hover/user:text-[#fb6a51] transition-all duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-slate-500 whitespace-nowrap group-hover/user:text-[#fb6a51] transition-all duration-300">
                  Hi, {session.user.email?.split("@")[0]}
                </span>
              </div>

              {/* Logout Button (Styled as Start Free) */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 bg-[#fb6a51] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-[#e55b44] hover:shadow-md transition-all active:scale-95 group"
              >
                <svg
                  className="size-4 group-hover:translate-x-0.5 transition-all duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
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

