import Link from "next/link";
import { Info } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="border-b border-[#f3dfb4] bg-[#fdf4e2]">
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-xs leading-relaxed text-[#8a6412] sm:px-6 sm:text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold">Guest mode.</strong> You are exploring a sample history
          for someone called Riley. Anything you log is kept in memory only and disappears when the
          server restarts.{" "}
          <Link href="/signup" className="font-semibold underline underline-offset-2">
            Create an account
          </Link>{" "}
          to keep your own.
        </span>
      </p>
    </div>
  );
}
