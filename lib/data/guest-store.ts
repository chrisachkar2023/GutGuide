import { DEMO_PROFILE, demoHistory } from "@/lib/data/demo-user";
import type { MealLog, SymptomLog, UserProfile } from "@/lib/types";

export type GuestData = {
  profile: UserProfile;
  meals: MealLog[];
  symptoms: SymptomLog[];
};

/**
 * Guest data lives only in this process.
 *
 * Restarting the server wipes every guest session, which is exactly the
 * intent: guest mode is a sandbox, not an account. Each guest gets their own
 * copy of the sample history so two browsers never share state.
 */
declare global {
  var __gutguideGuests: Map<string, GuestData> | undefined;
}

function guests(): Map<string, GuestData> {
  globalThis.__gutguideGuests ??= new Map();
  return globalThis.__gutguideGuests;
}

export function guestData(guestId: string): GuestData {
  const store = guests();
  let existing = store.get(guestId);

  if (!existing) {
    const { meals, symptoms } = demoHistory();
    existing = {
      profile: { ...DEMO_PROFILE, id: guestId },
      meals: meals.map((m) => ({ ...m, userId: guestId })),
      symptoms: symptoms.map((s) => ({ ...s, userId: guestId })),
    };
    store.set(guestId, existing);
  }

  return existing;
}

export function resetGuest(guestId: string): void {
  guests().delete(guestId);
}
