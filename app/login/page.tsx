import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell, GuestDivider } from "@/components/auth/auth-shell";
import { GuestButton, SignInForm } from "@/components/auth/auth-forms";
import { accountsEnabled, getActiveUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getActiveUser()) redirect("/");
  const enabled = accountsEnabled();

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where your log left off."
      footer={
        <>
          <GuestDivider />
          <GuestButton />
          <p className="mt-2.5 text-center text-xs leading-relaxed text-ink-faint">
            Guest mode explores a sample history. Nothing is saved, and it resets when the server
            restarts.
          </p>
        </>
      }
    >
      {!enabled && (
        <p className="mb-4 rounded-xl bg-[#fdf4e2] px-3.5 py-2.5 text-sm text-[#8a6412]">
          No database is configured, so accounts are turned off. Continue as a guest to explore the
          whole app.
        </p>
      )}
      <SignInForm accountsEnabled={enabled} />
    </AuthShell>
  );
}
