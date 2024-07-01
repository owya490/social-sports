"use client";
import Loading from "@/components/loading/Loading";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsAboutCard from "@/components/organiser/OrganiserSettingsAboutCard";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import StripeSetup from "@/components/utility/StripeSetup";
import { useUser } from "@/components/utility/UserContext";
import { getStripeAccId, getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import React, { useEffect, useState } from "react";

const page = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [stripeId, setStripeId] = useState<string>("");

  useEffect(() => {
    const fetchStripeId = async () => {
      if (user.userId === "") {
        console.error("User not found");
        return;
      }
      try {
        const response = await getStripeAccId(user.userId);
        if (!response) {
          setStripeId("Account not set up yet");
        } else {
          setStripeId(response);
        }
      } catch (error) {
        console.error("fetchStripeId Error: ", error);
      }
    };
    fetchStripeId();
  }, [user]);

  return loading ? (
    <Loading />
  ) : (
    <div className="ml-14 mt-16">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar currPage="Settings" />
        <div className="p-12 space-y-8">
          <OrganiserSettingsStripeCard stripeId={stripeId} />
          {!user.stripeAccountActive && <StripeSetup userId={user.userId} setLoading={setLoading} />}
          {/* <OrganiserSettingsAboutCard /> */}
          <h1 className="pt-20 text-3xl font-bold text-center">More features coming soon!</h1>
        </div>
      </div>
    </div>
  );
};

export default page;
