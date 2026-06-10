"use client";

/**
 * Client-side PDF generation (jsPDF) for final reports.
 * - generateReportPdf: one player's report (county/mode, stats, timeline,
 *   civic letter, proof screenshot).
 * - generateClassReportPdf: a whole class in one document, one student per
 *   page-run, with teacher-selectable sections.
 */

import { jsPDF } from "jspdf";
import type { GameState } from "../engine/types";
import { formatYearMonth, effectiveCarbonGain } from "../engine/engine";

/** Which report sections to include (teachers can trim the combined export). */
export interface ReportSections {
  stats: boolean;
  timeline: boolean;
  letter: boolean;
}

/**
 * jsPDF's built-in fonts only cover Latin-1. Anything outside it (smart
 * quotes typed into letters, the U+2212 minus in log entries, emoji, ✓)
 * renders as garbage bytes in the PDF, so map common typography to ASCII
 * and drop whatever's left.
 */
function pdfSafe(text: string): string {
  return text
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/−/g, "-")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[✓✔]/g, "")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, "")
    .replace(/[ \t]+/g, " ");
}

async function loadImageDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = data;
    });
    return { data, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

function roleLabelFor(state: GameState): string {
  return state.characterType === "mayor"
    ? "Mayor"
    : state.characterType === "student_older"
      ? "Student (14-18)"
      : "Student (9-14)";
}

/** Page-aware text writer bound to one jsPDF doc. */
function makeWriter(doc: jsPDF) {
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 120, 70);
    doc.text(pdfSafe(text), margin, y);
    y += 20;
    doc.setTextColor(30, 30, 30);
  };

  const body = (text: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfSafe(text), maxW);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
  };

  return {
    margin,
    maxW,
    ensureSpace,
    heading,
    body,
    get y() {
      return y;
    },
    set y(v: number) {
      y = v;
    },
    gap(px: number) {
      y += px;
    },
    doc,
  };
}

type Writer = ReturnType<typeof makeWriter>;

/** Title block + the selected sections for one player. */
function writeReportSections(
  w: Writer,
  state: GameState,
  sections: ReportSections,
  proofImg: { data: string; w: number; h: number } | null,
) {
  const { doc, margin } = w;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(pdfSafe("Carbon Cleaner, Final Report"), margin, w.y);
  w.gap(26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  const outcome = state.status === "won" ? "Reached net-zero" : "Did not reach net-zero";
  doc.text(
    pdfSafe(`${state.cityName}  -  ${roleLabelFor(state)}  -  ${outcome}`),
    margin,
    w.y,
  );
  w.gap(18);
  if (state.playerName) {
    doc.text(pdfSafe(`Player: ${state.playerName}`), margin, w.y);
    w.gap(18);
  }
  w.gap(6);
  doc.setTextColor(30, 30, 30);

  if (sections.stats) {
    w.heading("Final Statistics");
    w.body(`Carbon gain per month: ${effectiveCarbonGain(state).toFixed(4)} ppm/mo`);
    w.body(`Atmospheric carbon: ${state.carbonPpm.toFixed(1)} ppm`);
    w.body(`Population support: ${state.support.toFixed(0)}%`);
    w.body(`Date reached: ${formatYearMonth(state)}`);
    w.body(
      `Infrastructure built: ${state.builtInfra.length} - Research completed: ${state.completedResearch.length} - Bills passed: ${state.passedBills.length}`,
    );
    if (state.civic?.boostApplied) {
      w.body("Verified real-world civic action submitted.");
    }
    w.gap(6);
  }

  if (sections.timeline) {
    w.heading("Timeline of Key Actions");
    if (state.log.length === 0) w.body("No actions recorded.");
    else state.log.forEach((l) => w.body(`${l.yearMonth}, ${l.label}. ${l.detail}`));
    w.gap(6);
  }

  if (sections.letter && state.civic?.letter) {
    w.heading("Civic-Action Letter");
    w.body(state.civic.letter);
    if (state.civic.boostApplied) {
      doc.setTextColor(20, 120, 70);
      w.body("Verified real-world action submitted.", 9);
      doc.setTextColor(30, 30, 30);
    }
    w.gap(6);
  }

  if (proofImg && proofImg.w > 0) {
    w.heading("Proof of Action");
    const ratio = proofImg.h / proofImg.w;
    const imgW = Math.min(w.maxW, 360);
    const imgH = imgW * ratio;
    w.ensureSpace(imgH + 10);
    try {
      doc.addImage(proofImg.data, "PNG", margin, w.y, imgW, imgH);
      w.gap(imgH + 12);
    } catch {
      w.body("(Proof image could not be embedded.)", 9);
    }
  }
}

const ALL_SECTIONS: ReportSections = { stats: true, timeline: true, letter: true };

export async function generateReportPdf(state: GameState, proofUrl: string | null) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const proofImg = proofUrl ? await loadImageDataUrl(proofUrl) : null;
  writeReportSections(makeWriter(doc), state, ALL_SECTIONS, proofImg);
  doc.save(`${state.cityName.replace(/\s+/g, "-")}-carbon-cleaner-report.pdf`);
}

/**
 * One PDF for a whole class, each student starting on a fresh page. Sections
 * are teacher-selectable; the in-game action timeline defaults OFF in the UI
 * since it's gameplay noise for grading.
 */
export async function generateClassReportPdf(
  states: GameState[],
  sections: ReportSections,
  className: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  // Cover line
  const w0 = makeWriter(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(pdfSafe(`Class Report: ${className}`), w0.margin, w0.y);
  w0.gap(26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text(
    pdfSafe(`${states.length} student${states.length === 1 ? "" : "s"} - generated ${new Date().toLocaleDateString()}`),
    w0.margin,
    w0.y,
  );
  doc.setTextColor(30, 30, 30);

  for (const state of states) {
    doc.addPage();
    writeReportSections(makeWriter(doc), state, sections, null);
  }

  const safeName = (className || "class").replace(/\s+/g, "-");
  doc.save(`${safeName}-carbon-cleaner-reports.pdf`);
}
