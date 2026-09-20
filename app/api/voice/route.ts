import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

/** Rachel — ElevenLabs' default shared voice. Override with ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const bodySchema = z.object({ text: z.string().trim().min(1).max(900) });

function browserFallbackResponse(reason: string, status = 503, detail?: string) {
  return NextResponse.json(
    {
      fallback: "browser",
      reason,
      message:
        reason === "paid_plan_required"
          ? "ElevenLabs voice requires an active paid plan or a valid TTS-enabled key. Using browser speech instead."
          : detail || "ElevenLabs voice is unavailable right now; using browser speech instead.",
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
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5";

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: parsed.data.text,
          model_id: modelId,
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.82,
            style: 0.7,
            use_speaker_boost: true,
            speed: 0.96,
          },
        }),
      },
    );

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => null);
      const detail =
        payload?.detail?.message ??
        payload?.detail?.error ??
        payload?.error ??
        (response.status === 402
          ? "Your ElevenLabs key or voice is not enabled for TTS on this account. Verify the account, model, and voice in the ElevenLabs dashboard."
          : "ElevenLabs rejected the request.");
      const reason =
        payload?.detail?.code ??
        payload?.error ??
        (response.status === 402 ? "paid_plan_required" : "elevenlabs_unavailable");
      console.warn("[gutguide] ElevenLabs returned", response.status, reason, detail);
      return browserFallbackResponse(reason, response.status === 402 ? 402 : 503, detail);
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
