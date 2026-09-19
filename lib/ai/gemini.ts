import "server-only";
import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

let clientChecked = false;
let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (clientChecked) return client;
  clientChecked = true;
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  client = new GoogleGenAI({ apiKey });
  return client;
}

export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY);
}

/**
 * Shared framing for every prompt. GutGuide never diagnoses and never claims a
 * food will or will not cause a flare — the model is told so explicitly.
 */
export const SAFETY_PREAMBLE = `You are GutGuide, a food companion for people living with Crohn's disease.

Non-negotiable rules:
- Never diagnose, never give medical treatment advice, never tell someone to change medication.
- Never claim a food will or will not cause a flare. Crohn's is individual.
- Frame everything as an estimate drawn from this person's own logged history.
- Be warm, specific and plain-spoken. No hedging paragraphs, no disclaimers longer than the answer.
- Prefer concrete detail from the data you are given over generic nutrition advice.`;

export type TextRequest = {
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
};

/** Returns null (rather than throwing) so callers can fall back cleanly. */
export async function generateText({
  prompt,
  maxOutputTokens = 300,
  temperature = 0.6,
}: TextRequest): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: SAFETY_PREAMBLE,
        maxOutputTokens,
        temperature,
      },
    });
    const text = response.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch (error) {
    console.warn("[gutguide] Gemini text call failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export type JsonPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function generateJson<T>({
  parts,
  schema,
  temperature = 0.3,
  maxOutputTokens = 2200,
}: {
  parts: JsonPart[];
  schema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<T | null> {
  const ai = getGemini();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SAFETY_PREAMBLE,
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: schema as any,
        temperature,
        maxOutputTokens,
      },
    });
    const text = response.text?.trim();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("[gutguide] Gemini JSON call failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export { Type };
