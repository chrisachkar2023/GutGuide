import { NextResponse } from "next/server";
import { z } from "zod";
import { scanMenu } from "@/lib/ai/menu";
import { getUserContext } from "@/lib/scoring/context";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z
  .object({
    text: z.string().max(20_000).optional(),
    imageBase64: z.string().max(12_000_000).optional(),
    mimeType: z.string().max(80).optional(),
  })
  .refine((v) => Boolean(v.text?.trim() || v.imageBase64), {
    message: "Send menu text or an image.",
  });

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That request did not look right." },
      { status: 400 },
    );
  }

  try {
    const ctx = await getUserContext();
    const result = await scanMenu(parsed.data, ctx);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[gutguide] menu scan failed:", error);
    return NextResponse.json(
      { error: "The scan did not complete. Try pasting the menu text instead." },
      { status: 500 },
    );
  }
}
