import { NextRequest, NextResponse } from "next/server";

/**
 * Lenient civic-action proof check.
 * This is intentionally NOT a forgery detector. It loosely verifies that the
 * uploaded screenshot plausibly looks like an email/message about climate
 * change.
 *
 * - If ANTHROPIC_API_KEY is set, it sends the image + a short rubric to a
 *   Claude vision call and accepts on a loose "looks like a climate email" yes.
 * - Otherwise it falls back to a simple keyword check over any provided OCR
 *   text / letter body. Designed to pass easily for genuine attempts.
 */

const CLIMATE_TERMS = [
  "climate", "carbon", "emission", "warming", "greenhouse", "co2", "co₂",
  "fossil", "renewable", "solar", "wind", "sustainab", "environment",
  "pollution", "net-zero", "net zero", "clean energy", "temperature",
];
const EMAIL_MARKERS = ["dear", "subject", "sincerely", "regards", "to:", "from:", "representative", "council", "senator", "mayor", "@"];

function keywordCheck(text: string): { passed: boolean; reason: string } {
  const t = (text || "").toLowerCase();
  const climateHits = CLIMATE_TERMS.filter((w) => t.includes(w)).length;
  const emailHits = EMAIL_MARKERS.filter((w) => t.includes(w)).length;
  const passed = climateHits >= 1 && emailHits >= 1;
  return {
    passed,
    reason: passed
      ? "Looks like a message about climate change addressed to someone."
      : "Couldn't clearly find both an email structure and climate-related text. Make sure your screenshot shows an email about climate change.",
  };
}

async function visionCheck(
  imageBase64: string,
  mediaType: string,
): Promise<{ passed: boolean; reason: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                text:
                  "This is a student's proof of civic action. Loosely and generously decide: does this image look like an email or message addressed to another person (e.g. a representative) that mentions climate change or the environment? This is NOT a forgery check — be lenient. Reply with exactly 'YES' or 'NO' then a short reason.",
              },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const passed = /^\s*yes/i.test(text);
    return { passed, reason: text.replace(/^\s*(yes|no)\b[:\-\s]*/i, "").trim() || (passed ? "Looks valid." : "Doesn't look like a climate email.") };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mediaType, ocrText, letter } = body as {
      imageBase64?: string;
      mediaType?: string;
      ocrText?: string;
      letter?: string;
    };

    // Try AI vision first (if configured + image provided)
    if (imageBase64 && mediaType) {
      const v = await visionCheck(imageBase64, mediaType);
      if (v) return NextResponse.json({ ...v, method: "vision" });
    }

    // Fallback: keyword check over OCR text or the composed letter
    const result = keywordCheck(ocrText || letter || "");
    return NextResponse.json({ ...result, method: "keyword" });
  } catch {
    return NextResponse.json(
      { passed: false, reason: "Could not process the upload.", method: "error" },
      { status: 400 },
    );
  }
}
