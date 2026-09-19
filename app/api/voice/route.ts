import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/** Rachel — ElevenLabs' default shared voice. Override with ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const bodySchema = z.object({ text: z.string().trim().min(1).max(900) });

function browserFallbackResponse(reason: string, status = 503) {
  return NextResponse.json(
    {
      fallback: "browser",
      reason,
      message:
        reason === "paid_plan_required"
          ? "ElevenLabs voice requires an active paid plan; using browser speech instead."
          : "ElevenLabs voice is unavailable right now; using browser speech instead.",
    },
    { status },
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // The client falls back to the browser's own speech synthesis.
    return browserFallbackResponse("missing_api_key");
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Send some text to read." }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: parsed.data.text,
          model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5",
          voice_settings: { stability: 0.45, similarity_boost: 0.75, speed: 0.95 },
        }),
      },
    );

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      const reason =
        payload?.detail?.code ??
        payload?.error ??
        (response.status === 402 ? "paid_plan_required" : "elevenlabs_unavailable");
      console.warn("[gutguide] ElevenLabs returned", response.status, reason);
      return browserFallbackResponse(reason, response.status === 402 ? 402 : 503);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("[gutguide] voice request failed:", error instanceof Error ? error.message : error);
    return browserFallbackResponse("elevenlabs_unavailable");
  }
}
