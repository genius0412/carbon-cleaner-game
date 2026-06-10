/**
 * Minimal grading export for teachers: one row per student with just what's
 * needed to grade, no gameplay noise. Pure (no DOM/React) so it's testable;
 * the download itself happens in the calling component.
 */

import type { GameState } from "../engine/types";
import { formatYearMonth, effectiveCarbonGain } from "../engine/engine";

function roleLabelFor(state: GameState): string {
  return state.characterType === "mayor"
    ? "Mayor"
    : state.characterType === "student_older"
      ? "Student (14-18)"
      : "Student (9-14)";
}

function outcomeFor(state: GameState): string {
  if (state.status === "won") return "Reached net-zero";
  if (state.status === "lost") return "Lost";
  return "Still playing";
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function classGradingCsv(states: GameState[]): string {
  const header = [
    "Player",
    "County",
    "Role",
    "Outcome",
    "In-game date",
    "Carbon gain (ppm/mo)",
    "Carbon (ppm)",
    "Support (%)",
    "Letter written",
    "Verified civic action",
  ];
  const rows = states.map((s) => [
    s.playerName || "",
    s.cityName,
    roleLabelFor(s),
    outcomeFor(s),
    formatYearMonth(s),
    effectiveCarbonGain(s).toFixed(4),
    s.carbonPpm.toFixed(1),
    s.support.toFixed(0),
    s.civic?.letter ? "yes" : "no",
    s.civic?.boostApplied ? "yes" : "no",
  ]);
  // BOM + CRLF so Excel opens it cleanly with UTF-8 intact.
  return (
    "\uFEFF" +
    [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
