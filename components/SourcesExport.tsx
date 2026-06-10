"use client";

import { Button } from "@/components/ui/Button";
import { jsPDF } from "jspdf";

/** Trigger a browser download for a generated file blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download buttons for the Works Cited list (PDF and Word). */
export function SourcesExport({ sources }: { sources: string[] }) {
  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = pageW - margin * 2;
    let y = margin;

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("Works Cited", pageW / 2, y, { align: "center" });
    y += 28;

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    for (const s of sources) {
      const lines: string[] = doc.splitTextToSize(s, maxW - 24);
      for (let i = 0; i < lines.length; i++) {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        // MLA hanging indent: first line flush, following lines indented.
        doc.text(lines[i], margin + (i === 0 ? 0 : 24), y);
        y += 18;
      }
      y += 6;
    }
    doc.save("carbon-cleaner-works-cited.pdf");
  };

  const exportDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
      await import("docx");
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [new TextRun("Works Cited")],
            }),
            ...sources.map(
              (s) =>
                new Paragraph({
                  children: [new TextRun(s)],
                  indent: { left: 720, hanging: 720 }, // MLA hanging indent
                  spacing: { after: 240, line: 480 },
                }),
            ),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, "carbon-cleaner-works-cited.docx");
  };

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Button onClick={exportPdf}>⬇ Download PDF</Button>
      <Button variant="secondary" onClick={exportDocx}>
        ⬇ Download Word (.docx)
      </Button>
    </div>
  );
}
