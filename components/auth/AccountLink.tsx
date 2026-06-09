"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Auth-aware nav link: shows "Account" with the user's display name when logged
 * in, and nothing when logged out (the page already links to log in/sign up).
 */
export function AccountLink({ className = "" }: { className?: string }) {
  const { user, loading } = useAuth();
  if (loading || !user) return null;
  const label = user.displayName ?? user.username ?? "Account";
  return (
    <Link href="/account" className={`transition-colors hover:text-fog ${className}`}>
      👤 {label}
    </Link>
  );
}
