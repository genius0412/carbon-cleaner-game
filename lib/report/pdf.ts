"use client";

/**
 * Client-side PDF generation for the final report (jsPDF).
 * Includes: city/mode, final stats, action timeline, civic-action letter,
 * proof screenshot (if available), and the MLA bibliography.
 */

import { jsPDF } from "jspdf";
import type { GameState } from "../engine/types";
import { formatYearMonth, effectiveCarbonGain } from "../engine/engine";
import { aggregatedSources, allBlanks, blankTag } from "../config/dataBlanks";

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

export async function generateReportPdf(state: GameState, proofUrl: string | null) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
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
    doc.text(text, margin, y);
    y += 20;
    doc.setTextColor(30, 30, 30);
  };

  const body = (text: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Carbon Cleaner — Final Report", margin, y);
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  const role =
    state.characterType === "mayor"
      ? "Mayor"
      : state.characterType === "student_older"
        ? "Student (14–18)"
        : "Student (9–14)";
  doc.text(`${state.cityName}  ·  ${role}  ·  ${state.status === "won" ? "Reached net-zero" : "Did not reach net-zero"}`, margin, y);
  y += 24;
  doc.setTextColor(30, 30, 30);

  // Stats
  heading("Final Statistics");
  body(`Carbon gain per month: ${effectiveCarbonGain(state).toFixed(4)} ppm/mo`);
  body(`Atmospheric carbon: ${state.carbonPpm.toFixed(1)} ppm`);
  body(`Population support: ${state.support.toFixed(0)}%`);
  body(`Date reached: ${formatYearMonth(state)}`);
  body(`Infrastructure built: ${state.builtInfra.length} · Research completed: ${state.completedResearch.length} · Bills passed: ${state.passedBills.length}`);
  y += 6;

  // Timeline
  heading("Timeline of Key Actions");
  if (state.log.length === 0) body("No actions recorded.");
  else state.log.forEach((l) => body(`${l.yearMonth} — ${l.label}. ${l.detail}`));
  y += 6;

  // Civic letter
  if (state.civic?.letter) {
    heading("Civic-Action Letter");
    body(state.civic.letter);
    if (state.civic.boostApplied) {
      doc.setTextColor(20, 120, 70);
      body("Verified real-world action submitted.", 9);
      doc.setTextColor(30, 30, 30);
    }
    y += 6;
  }

  // Proof image
  if (proofUrl) {
    const img = await loadImageDataUrl(proofUrl);
    if (img && img.w > 0) {
      heading("Proof of Action");
      const ratio = img.h / img.w;
      const w = Math.min(maxW, 360);
      const h = w * ratio;
      ensureSpace(h + 10);
      try {
        doc.addImage(img.data, "PNG", margin, y, w, h);
        y += h + 12;
      } catch {
        body("(Proof image could not be embedded.)", 9);
      }
    }
  }

  // Bibliography
  heading("Bibliography (MLA)");
  const sources = aggregatedSources();
  if (sources.length === 0) {
    body(
      "No sources cited yet. Outstanding data points needing citations: " +
        allBlanks().filter((b) => !b.source).map((b) => blankTag(b.id)).join(", ") +
        ".",
      9,
    );
  } else {
    sources.forEach((s) => body(s.source, 10));
  }

  doc.save(`${state.cityName.replace(/\s+/g, "-")}-carbon-cleaner-report.pdf`);
}
