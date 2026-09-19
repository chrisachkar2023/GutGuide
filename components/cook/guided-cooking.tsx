"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeStep } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function spokenText(step: RecipeStep): string {
  return step.tip ? `${step.instruction} Tip: ${step.tip}` : step.instruction;
}

/**
 * Hands-free cooking mode.
 *
 * Reads each step aloud through ElevenLabs when a key is configured and falls
 * back to the browser's own speech synthesis otherwise, so the feature still
 * works in a live demo without any credentials.
 */
export function GuidedCooking({
  title,
  steps,
  onExit,
}: {
  title: string;
  steps: RecipeStep[];
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceSource, setVoiceSource] = useState<"elevenlabs" | "browser" | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stopAudio();
      setSpeaking(true);
      try {
        const response = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (response.ok && response.headers.get("Content-Type")?.includes("audio")) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setSpeaking(false);
          audio.onerror = () => setSpeaking(false);
          setVoiceSource("elevenlabs");
          await audio.play();
          return;
        }
      } catch {
        // Fall through to the browser voice below.
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        setVoiceSource("browser");
        window.speechSynthesis.speak(utterance);
      } else {
        setSpeaking(false);
      }
    },
    [stopAudio],
  );

  // Moving between steps also reads the new one, so navigation stays hands-free.
  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, next));
      setIndex(clamped);
      stopAudio();
      if (voiceOn && steps[clamped]) void speak(spokenText(steps[clamped]));
    },
    [steps, voiceOn, speak, stopAudio],
  );

  // Read the opening step once on entry.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !steps[0]) return;
    opened.current = true;
    void speak(spokenText(steps[0]));
  }, [steps, speak]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  // Hands are busy, so arrow keys drive the whole thing.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, onExit]);

  const announceTimerDone = useCallback(() => {
    if (voiceOn) void speak("Time is up. Check on it when you get a moment.");
  }, [voiceOn, speak]);

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream-50">
      <header className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={onExit}
          className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-black/5"
        >
          <X className="h-5 w-5" aria-hidden />
          <span className="sr-only">Leave cooking mode</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          <p className="text-xs text-ink-faint">
            Step {index + 1} of {steps.length}
            {voiceSource && voiceOn && (
              <> · {voiceSource === "elevenlabs" ? "ElevenLabs voice" : "browser voice"}</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (voiceOn) {
              stopAudio();
              setVoiceOn(false);
            } else {
              setVoiceOn(true);
              void speak(spokenText(step));
            }
          }}
          aria-pressed={voiceOn}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full transition-colors",
            voiceOn ? "bg-moss-600 text-white" : "text-ink-soft hover:bg-black/5",
          )}
        >
          {speaking ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : voiceOn ? (
            <Volume2 className="h-5 w-5" aria-hidden />
          ) : (
            <VolumeX className="h-5 w-5" aria-hidden />
          )}
          <span className="sr-only">{voiceOn ? "Turn voice off" : "Turn voice on"}</span>
        </button>
      </header>

      <div className="h-1 w-full bg-black/[0.06]">
        <div
          className="h-full bg-moss-500 transition-all duration-300"
          style={{ width: `${((index + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 py-8 sm:px-8">
        <div className="w-full max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss-600">Step {index + 1}</p>
          <p className="mt-4 font-display text-2xl leading-snug text-ink sm:text-4xl sm:leading-tight">
            {step.instruction}
          </p>

          {step.tip && (
            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white p-4 text-[0.95rem] leading-relaxed text-ink-soft ring-1 ring-inset ring-black/5">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" aria-hidden />
              {step.tip}
            </p>
          )}

          {step.timerSeconds && (
            <StepTimer key={index} seconds={step.timerSeconds} onDone={announceTimerDone} />
          )}
        </div>
      </div>

      <footer className="border-t border-black/5 bg-white/70 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Button variant="secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button className="flex-1" size="lg" onClick={() => (isLast ? onExit() : goTo(index + 1))}>
            {isLast ? (
              <>
                <Check className="h-4 w-4" aria-hidden />
                Done cooking
              </>
            ) : (
              <>
                Next step
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
        <p className="mx-auto mt-2.5 max-w-2xl text-center text-xs text-ink-faint">
          Arrow keys move between steps, so you can keep your hands where they are.
        </p>
      </footer>
    </div>
  );
}

/** Remounted per step via `key`, so each step gets a fresh clock. */
function StepTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const announced = useRef(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining > 0 || announced.current) return;
    announced.current = true;
    onDone();
  }, [remaining, onDone]);

  const done = remaining <= 0;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-inset ring-black/5">
      <span className="font-display text-4xl font-semibold tabular-nums text-ink">
        {formatClock(Math.max(0, remaining))}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setRunning((v) => !v)} disabled={done}>
          {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? "Pause" : "Start timer"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            announced.current = false;
            setRemaining(seconds);
            setRunning(false);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </Button>
      </div>
      {done && <span className="text-sm font-medium text-moss-700">Time is up — go check.</span>}
    </div>
  );
}
