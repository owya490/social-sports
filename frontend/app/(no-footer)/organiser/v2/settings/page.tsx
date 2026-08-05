"use client";

import LoadingOrganiser from "@/components/loading/LoadingOrganiser";
import { SettingsHeader } from "@/components/organiser/v2/settings/SettingsHeader";
import { SettingsPreferencesPanel } from "@/components/organiser/v2/settings/SettingsPreferencesPanel";
import { SettingsStripePanel } from "@/components/organiser/v2/settings/SettingsStripePanel";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { getStripeAccId } from "@/services/src/stripe/stripeService";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserSettingsV2");

export default function OrganiserSettingsV2Page() {
  const { user, userLoading } = useUser();
  const [stripeSetupLoading, setStripeSetupLoading] = useState(false);
  const [stripeId, setStripeId] = useState("");
  const [stripeLoading, setStripeLoading] = useState(true);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchStripeId = async () => {
      if (userLoading || !user?.userId) {
        return;
      }
      setStripeLoading(true);
      try {
        const response = await getStripeAccId(user.userId);
        setStripeId(response || "");
      } catch (error) {
        logger.error(`Error fetching Stripe account ID: ${error}`);
        setStripeId("");
      } finally {
        setStripeLoading(false);
      }
    };
    void fetchStripeId();
  }, [user, userLoading]);

  if (stripeSetupLoading) {
    return <LoadingOrganiser />;
  }

  const subtitle = stripeLoading
    ? "Loading your account…"
    : stripeId
      ? "Email preferences and Stripe payouts"
      : "Email preferences · connect Stripe to get paid";

  return (
    <>
      {/* THESIS: Account controls in quiet panels—preferences and payouts without card chrome noise.
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
            userId={user.userId}
            userLoading={userLoading}
            onConnecting={setStripeSetupLoading}
          />
        </div>
      </div>
    </>
  );
}
