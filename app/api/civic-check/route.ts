import { NextRequest, NextResponse } from "next/server";

/**
 * Lenient civic-action proof check.
 * This is intentionally NOT a forgery detector. It loosely verifies that the
 * uploaded screenshot plausibly looks like an email/message about climate
 * change. Provider preference, first available wins:
 *
 *   1. GEMINI_API_KEY    → Google Gemini vision (primary)
 *   2. ANTHROPIC_API_KEY → Claude vision (fallback)
 *   3. neither set        → accept the upload as-is (no model to look at it)
 *
 * When a vision call is configured but fails, it falls back to a keyword check
 * over any OCR text / letter body. The screenshot is always stored and shown in
 * the final report regardless of which path runs.
 */

// Shared rubric for every vision provider, lenient by design.
const CHECK_PROMPT =
  "This is a student's proof of civic action. Loosely and generously decide: does this image look like an email or message addressed to another person (e.g. a representative) that mentions climate change or the environment? This is NOT a forgery check, be lenient. Reply with exactly 'YES' or 'NO' then a short reason.";

/** Parse a "YES/NO + reason" reply into a pass/fail result. */
function parseVerdict(text: string): { passed: boolean; reason: string } {
  const passed = /^\s*yes/i.test(text);
  // Strip the leading YES/NO plus any trailing punctuation (".", ",", ":", "-", etc.)
  // so the reason doesn't render as e.g. ". This image shows…".
  const stripped = text.replace(/^\s*(yes|no)\b[\s.,:;!\-, –]*/i, "").trim();
  // A reply cut off mid-sentence (the model ran out of output tokens) can
  // leave a meaningless fragment like "The"; players get the canned reason
  // instead of a corrupt one.
  const fallback = passed
    ? "Looks valid."
    : "That doesn't look like an email about climate change. Make sure your screenshot shows the message you sent.";
  return { passed, reason: stripped.length >= 12 ? stripped : fallback };
}

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

/** Google Gemini vision check (primary). Returns null if unconfigured/errored. */
async function geminiCheck(
  imageBase64: string,
  mediaType: string,
): Promise<{ passed: boolean; reason: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("[civic-check] GEMINI_API_KEY not set, skipping Gemini.");
    return null;
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: imageBase64 } },
                { text: CHECK_PROMPT },
              ],
            },
          ],
          generationConfig: {
            // Generous cap: on Gemini 2.5 models hidden "thinking" tokens
            // count against this budget, and a starved reply comes back cut
            // off mid-sentence ("NO. The").
            maxOutputTokens: 1024,
            temperature: 0,
            // 2.5 models think by default; the verdict doesn't need it and it
            // burns the token budget. Older models reject thinkingConfig.
            ...(/2\.5/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[civic-check] Gemini HTTP ${res.status} (model="${model}"): ${body.slice(0, 500)}`,
      );
      return null;
    }
    const data = await res.json();
    // Join every text part, skipping "thought" parts (2.5 thinking models
    // can split the visible answer across parts after a thought summary).
    const parts: { text?: string; thought?: boolean }[] =
      data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text)
      .join(" ")
      .trim();
    if (!text) {
      console.error(
        `[civic-check] Gemini returned no text (finishReason=${
          data?.candidates?.[0]?.finishReason ?? "?"
        }). Raw: ${JSON.stringify(data).slice(0, 500)}`,
      );
      return null;
    }
    console.log(`[civic-check] Gemini OK (model="${model}"): ${text.trim().slice(0, 120)}`);
    return parseVerdict(text);
  } catch (err) {
    console.error("[civic-check] Gemini request threw:", err);
    return null;
  }
}

/** Anthropic Claude vision check (fallback). Returns null if unconfigured/errored. */
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
              { type: "text", text: CHECK_PROMPT },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    return parseVerdict(text);
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

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

    // No AI configured → accept the upload as-is. There's no model to look at
    // the screenshot, and we don't want to block genuine attempts. The image is
    // still stored and appears in the final report.
    if (!hasGemini && !hasAnthropic) {
      return NextResponse.json({
        passed: true,
        reason: "Proof received, thanks for taking real action!",
        method: "accepted",
      });
    }

    // Try vision: Gemini first (primary), then Claude (fallback).
    if (imageBase64 && mediaType) {
      const g = await geminiCheck(imageBase64, mediaType);
      if (g) return NextResponse.json({ ...g, method: "gemini" });
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
