"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CircleAlert, Loader2 } from "lucide-react";
import { AUTH_IDLE, guestAction, signInAction, signUpAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FIELD =
  "h-11 w-full rounded-xl bg-cream-100 px-4 text-[0.95rem] text-ink outline-none ring-1 ring-inset " +
  "ring-black/5 placeholder:text-ink-faint focus:ring-2 focus:ring-moss-400";

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-clay-50 px-3.5 py-2.5 text-sm text-clay-600"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {error}
    </p>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

export function SignInForm({ accountsEnabled }: { accountsEnabled: boolean }) {
  const [state, action] = useActionState(signInAction, AUTH_IDLE);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!accountsEnabled}
          className={cn(FIELD, !accountsEnabled && "opacity-60")}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={!accountsEnabled}
          className={cn(FIELD, !accountsEnabled && "opacity-60")}
        />
      </div>

      <ErrorNote error={state.error} />
      <SubmitButton>Sign in</SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-moss-700 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ accountsEnabled }: { accountsEnabled: boolean }) {
  const [state, action] = useActionState(signUpAction, AUTH_IDLE);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          What should we call you?
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="given-name"
          required
          disabled={!accountsEnabled}
          placeholder="Riley"
          className={cn(FIELD, !accountsEnabled && "opacity-60")}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!accountsEnabled}
          className={cn(FIELD, !accountsEnabled && "opacity-60")}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={!accountsEnabled}
          className={cn(FIELD, !accountsEnabled && "opacity-60")}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          At least 8 characters, with a letter and a number.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-cream-100/70 p-3.5">
        <input
          type="checkbox"
          name="sampleData"
          defaultChecked
          disabled={!accountsEnabled}
          className="mt-0.5 h-4 w-4 rounded border-black/20 accent-moss-600"
        />
        <span className="text-sm text-ink-soft">
          <span className="font-medium text-ink">Start with sample history.</span> Fills your account
          with 120 days of example meals and check-ins so every screen has something to show. You can
          log over it straight away.
        </span>
      </label>

      <ErrorNote error={state.error} />
      <SubmitButton>Create account</SubmitButton>

      <p className="text-center text-sm text-ink-soft">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-moss-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function GuestButton() {
  return (
    <form action={guestAction}>
      <GuestSubmit />
    </form>
  );
}

function GuestSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      Continue as a guest
    </Button>
  );
}
