import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell, GuestDivider } from "@/components/auth/auth-shell";
import { GuestButton, SignUpForm } from "@/components/auth/auth-forms";
import { accountsEnabled, getActiveUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await getActiveUser()) redirect("/");
  const enabled = accountsEnabled();

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your log stays yours. Everything GutGuide suggests is calculated from it."
      footer={
        <>
          <GuestDivider />
          <GuestButton />
          <p className="mt-2.5 text-center text-xs leading-relaxed text-ink-faint">
            Prefer to look around first? Guest mode needs no account and saves nothing.
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
      <SignUpForm accountsEnabled={enabled} />
    </AuthShell>
  );
}
