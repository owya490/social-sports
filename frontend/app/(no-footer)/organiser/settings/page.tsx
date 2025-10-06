"use client";
import StripeSetup from "@/components/elements/StripeSetup";
import Loading from "@/components/loading/Loading";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsCard from "@/components/organiser/settings/OrganiserSettingsCard";
import OrganiserSettingsStripeCard from "@/components/organiser/settings/OrganiserSettingsStripeCard";
import { useUser } from "@/components/utility/UserContext";
import { getStripeAccId } from "@/services/src/stripe/stripeService";
import { useEffect, useState } from "react";

const Settings = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [stripeId, setStripeId] = useState<string>("");

  useEffect(() => {
    const fetchStripeId = async () => {
      const response = await getStripeAccId(user.userId);
      if (!response) {
        setStripeId("Account not set up yet");
      } else {
        setStripeId(response);
      }
    };
    fetchStripeId();
  }, [user]);

  return loading ? (
    <Loading />
  ) : (
    <div className="md:ml-14 mt-14">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar />
        <div className="p-2 space-y-4">
          <OrganiserSettingsCard />
          <OrganiserSettingsStripeCard stripeId={stripeId} />
          {!user.stripeAccountActive && <StripeSetup userId={user.userId} setLoading={setLoading} />}
          <h1 className="pt-20 text-3xl font-bold text-center">More features coming soon!</h1>
        </div>
      </div>
    </div>
  );
};

export default Settings;
