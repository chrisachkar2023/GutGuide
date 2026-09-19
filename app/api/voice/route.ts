import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/** Rachel — ElevenLabs' default shared voice. Override with ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const bodySchema = z.object({ text: z.string().trim().min(1).max(900) });

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // The client falls back to the browser's own speech synthesis.
    return NextResponse.json({ fallback: "browser" }, { status: 503 });
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
      console.warn("[gutguide] ElevenLabs returned", response.status);
      return NextResponse.json({ fallback: "browser" }, { status: 503 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.warn("[gutguide] voice request failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ fallback: "browser" }, { status: 503 });
  }
}
