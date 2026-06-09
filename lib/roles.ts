/**
 * Pure, environment-agnostic role helpers shared by client components AND
 * server routes. This file deliberately has NO "use client" directive: when a
 * "use client" module is imported into a Server Component / API route, its
 * exports become client-reference proxies that throw when actually invoked on
 * the server. The classroom create/update routes call sanitizeRoles, so these
 * helpers must live in a neutral module both sides can import safely.
 */

import type { CharacterType } from "./engine/types";

/** Every role a class could allow, with a short label for the settings UI. */
export const ALL_ROLES: { type: CharacterType; label: string }[] = [
  { type: "mayor", label: "Mayor" },
  { type: "student_older", label: "Student (14–18)" },
  { type: "student_younger", label: "Student (9–14)" },
];

/** Keep only valid role strings (guards against junk from the DB or a client). */
export function sanitizeRoles(roles: unknown): CharacterType[] {
  if (!Array.isArray(roles)) return [];
  const valid = ALL_ROLES.map((r) => r.type);
  return valid.filter((t) => roles.includes(t));
}

/** Short label for a role, e.g. "Mayor". Falls back to the raw value. */
export function roleLabel(type: CharacterType | null): string | null {
  if (!type) return null;
  return ALL_ROLES.find((r) => r.type === type)?.label ?? type;
}
