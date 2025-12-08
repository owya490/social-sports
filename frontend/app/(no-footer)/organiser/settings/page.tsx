"use client";
import StripeSetup from "@/components/elements/StripeSetup";
import LoadingOrganiser from "@/components/loading/LoadingOrganiser";
import OrganiserSettingsCard from "@/components/organiser/settings/OrganiserSettingsCard";
import OrganiserSettingsStripeCard from "@/components/organiser/settings/OrganiserSettingsStripeCard";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { getStripeAccId } from "@/services/src/stripe/stripeService";
import { useEffect, useState } from "react";

const Settings = () => {
  const { user, userLoading } = useUser();
  const [stripeSetupLoading, setStripeSetupLoading] = useState<boolean>(false);
  const [stripeId, setStripeId] = useState<string>("");
  const [stripeLoading, setStripeLoading] = useState<boolean>(true);
  const stripeSetupLogger = new Logger("stripeSetupLogger");

  useEffect(() => {
    const fetchStripeId = async () => {
      if (userLoading || !user?.userId) {
        return;
      }
      setStripeLoading(true);
      try {
        const response = await getStripeAccId(user.userId);
        if (!response) {
          setStripeId("");
        } else {
          setStripeId(response);
        }
      } catch (error) {
        stripeSetupLogger.error(`Error fetching Stripe account ID: ${error}`);
        setStripeId("");
      } finally {
        setStripeLoading(false);
      }
    };
    fetchStripeId();
  }, [user, userLoading]);

  return stripeSetupLoading ? (
    <LoadingOrganiser />
  ) : (
    <div className="min-h-screen">
      <div className="pt-2 md:py-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mt-2 sm:mt-0">Settings</h1>
          <h2 className="pt-2 sm:pt-4 text-lg md:text-2xl font-semibold text-[#BABABA]">
            Manage your organiser account preferences
          </h2>

          <div className="mt-8 space-y-6">
            <OrganiserSettingsCard />
            <OrganiserSettingsStripeCard stripeId={stripeId} stripeLoading={stripeLoading} />
            {!stripeLoading && !stripeId && (
              <StripeSetup userId={user.userId} setLoading={setStripeSetupLoading} userLoading={userLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
