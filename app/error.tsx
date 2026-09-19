"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[gutguide] render error:", error);
  }, [error]);

  return (
    <div className="py-16">
      <EmptyState
        icon={<span className="text-3xl">😵‍💫</span>}
        title="Something went wrong on our end"
        description="Your logged entries are safe. Try again, or head back home and take another run at it."
        action={
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Back home
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
