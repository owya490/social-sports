"use client";

import { SettingsHeader } from "@/components/organiser/v2/settings/SettingsHeader";
import { SettingsPreferencesPanel } from "@/components/organiser/v2/settings/SettingsPreferencesPanel";
import { SettingsStripePanel } from "@/components/organiser/v2/settings/SettingsStripePanel";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getStripeAccId } from "@/services/src/stripe/stripeService";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const logger = new Logger("OrganiserSettingsV2");

export default function OrganiserSettingsV2Page() {
  const { user, userLoading, auth } = useUser();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <AccountSettings key={`${auth.currentUser?.uid ?? ""}:${user.userId}`} userId={user.userId} userLoading={userLoading} />;
}

function AccountSettings({ userId, userLoading }: { userId: UserId; userLoading: boolean }) {
  const { auth } = useUser();
  const [stripeId, setStripeId] = useState("");
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeError, setStripeError] = useState(false);
  const [readAttempt, setReadAttempt] = useState(0);
  const readInFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    const isCurrent = () => active && auth.currentUser?.uid === userId;
    setStripeLoading(true);
    setStripeError(false);
    const fetchStripeId = async () => {
      if (userLoading || !userId || auth.currentUser?.uid !== userId) {
        return;
      }
      readInFlightRef.current = true;
      try {
        const response = await getStripeAccId(userId);
        if (isCurrent()) setStripeId(response);
      } catch (error) {
        logger.error(`Error fetching Stripe account ID: ${error}`);
        if (isCurrent()) setStripeError(true);
      } finally {
        if (active) {
          readInFlightRef.current = false;
          if (auth.currentUser?.uid !== userId) setStripeError(true);
          setStripeLoading(false);
        }
      }
    };
    void fetchStripeId();
    return () => {
      active = false;
      readInFlightRef.current = false;
    };
  }, [auth, userId, userLoading, readAttempt]);

  const subtitle = stripeLoading
    ? "Loading your account..."
    : stripeError
      ? "Email preferences and Stripe payouts - status unavailable"
      : stripeId
        ? "Email preferences and Stripe payouts"
        : "Email preferences · connect Stripe to get paid";

  return (
    <>
      {/* THESIS: Account controls in quiet panels—preferences and payouts without card frame noise.
          OWN-WORLD: Honest Clubhouse tokens—outlined sections, accent switch, yellow connect CTA.
          STORY: Toggle ticket emails; connect or open Stripe.
          FIRST VIEWPORT: Title + subtitle, preference panel then Stripe panel.
          FORM: Established v2 operate extension; settings port.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <SettingsHeader subtitle={subtitle} />
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10 space-y-4">
          <SettingsPreferencesPanel />
          <SettingsStripePanel
            stripeId={stripeId}
            stripeLoading={stripeLoading}
            stripeError={stripeError}
            onRetryStripeStatus={() => {
              if (readInFlightRef.current || userLoading || !userId || auth.currentUser?.uid !== userId) return;
              readInFlightRef.current = true;
              setReadAttempt((attempt) => attempt + 1);
            }}
            userId={userId}
            userLoading={userLoading}
          />
        </div>
      </div>
    </>
  );
}
