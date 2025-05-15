"use client";

import StripeSetup from "@/components/elements/StripeSetup";
import OrganiserSettingsStripeCard from "@/components/organiser/settings/OrganiserSettingsStripeCard";
import { useUser } from "@/components/utility/UserContext";
import { getStripeAccId } from "@/services/src/stripe/stripeService";
import { useEffect, useState } from "react";

export default function SettingsContent() {
  const { user } = useUser();
  const [_loading, setLoading] = useState<boolean>(false);
  const [stripeId, setStripeId] = useState<string>("");

  useEffect(() => {
    const fetchStripeId = async () => {
      if (!user?.userId) return;

      const response = await getStripeAccId(user.userId);
      if (!response) {
        setStripeId("Account not set up yet");
      } else {
        setStripeId(response);
      }
    };
    fetchStripeId();
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="py-10 px-2 sm:p-20 space-y-6">
      <OrganiserSettingsStripeCard stripeId={stripeId} />
      {!user.stripeAccountActive && <StripeSetup userId={user.userId} setLoading={setLoading} />}
    </div>
  );
}
