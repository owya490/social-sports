"use client";

import { getStripeStandardAccountSetupLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname, redirectToExternalUrl } from "@/services/src/urlUtils";
import { useLayoutEffect, useRef, useState } from "react";
import { useUser } from "./UserContext";

type StripeSetupState =
  | { status: "idle" }
  | { status: "opening" | "failed"; returnPath: string };

type StripeSetupLifetime = {
  userId: string;
  profileUserId: string;
  inFlight: boolean;
};

export function useStripeSetupLink({ userId, eligible }: { userId: string; eligible: boolean }) {
  const { user, auth } = useUser();
  const authUserId = auth.currentUser?.uid;
  const [state, setState] = useState<StripeSetupState>({ status: "idle" });
  const lifetimeRef = useRef<StripeSetupLifetime | null>(null);
  const canOpen = eligible && Boolean(userId) && user.userId === userId && authUserId === userId;

  useLayoutEffect(() => {
    lifetimeRef.current = { userId, profileUserId: user.userId, inFlight: false };
    setState({ status: "idle" });
    return () => {
      lifetimeRef.current = null;
    };
  }, [userId, user.userId, authUserId, auth]);

  const openStripe = async (returnPath: string) => {
    const lifetime = lifetimeRef.current;
    if (!lifetime || lifetime.inFlight || !canOpen
      || lifetime.userId !== userId || lifetime.profileUserId !== userId
      || auth.currentUser?.uid !== userId) return;

    lifetime.inFlight = true;
    setState({ status: "opening", returnPath });
    const isCurrent = () => lifetimeRef.current === lifetime && auth.currentUser?.uid === userId;
    let navigated = false;
    try {
      window.scrollTo(0, 0);
      const link = await getStripeStandardAccountSetupLink(
        userId,
        getUrlWithCurrentHostname(returnPath),
        getRefreshAccountLinkUrl(),
      );
      if (isCurrent()) {
        redirectToExternalUrl(link);
        navigated = true;
      }
    } catch {
      if (!isCurrent()) return;
      setState({ status: "failed", returnPath });
    } finally {
      if (lifetimeRef.current === lifetime && !navigated) {
        lifetime.inFlight = false;
        if (!isCurrent()) setState({ status: "idle" });
      }
    }
  };

  const retry = () => {
    if (state.status === "failed") return openStripe(state.returnPath);
  };

  return {
    canOpen,
    openingDestination: state.status === "opening" ? state.returnPath : null,
    failed: state.status === "failed",
    openStripe,
    retry,
  };
}
