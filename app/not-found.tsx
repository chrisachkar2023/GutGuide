import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <div className="py-16">
      <EmptyState
        icon={<span className="text-3xl">🥣</span>}
        title="That page is not on the menu"
        description="The link may be out of date. Search the food library or head back to your home view."
        action={
          <div className="flex flex-wrap justify-center gap-2.5">
            <ButtonLink href="/">Back home</ButtonLink>
            <ButtonLink href="/search" variant="secondary">
              Search food
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
