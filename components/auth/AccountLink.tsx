"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Auth-aware nav controls.
 * Logged out: "Log in" link + "Sign up" pill so new players always see how to
 * get an account. Logged in: the user's name opens a small menu with account
 * settings and log out. `compact` is the mobile variant (tighter, icon-first).
 */
export function AuthNav({ compact = false }: { compact?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className={`flex items-center ${compact ? "gap-3 text-sm" : "gap-5"}`}>
        <Link href="/login" className="text-mist transition-colors hover:text-fog">
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-leaf/40 px-4 py-1.5 font-semibold text-leaf transition-colors hover:bg-leaf/10"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const label = user.displayName ?? user.username ?? "Account";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-mist transition-colors hover:text-fog ${
          compact ? "max-w-36 text-sm" : ""
        }`}
      >
        <span aria-hidden>👤</span>
        <span className="truncate">{label}</span>
        <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <>
          {/* invisible backdrop so any outside click/tap closes the menu */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-white/12 bg-night/95 p-1.5 text-left shadow-xl backdrop-blur"
          >
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-fog hover:bg-white/8"
            >
              ⚙️ Account settings
            </Link>
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
            >
              ↪ Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
