"use client";
import Loading from "@/components/loading/Loading";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsAboutCard from "@/components/organiser/OrganiserSettingsAboutCard";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import { useUser } from "@/components/utility/UserContext";
import { getStripeAccId, getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const page = () => {
  const router = useRouter();
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
          {!user.stripeAccountActive && (
            <div className="p-8 border-2 border-organiser-darker-light-gray rounded-3xl flex-col flex">
              <h2 className=" text-lg mb-2">Register for Organiser Hub!</h2>
              <p className="font-light text-sm">Join hundreds of sport societies hosting their events on Sportshub.</p>
              <p className="font-light text-sm">
                Leverage the ability to take bookings and payments right through the platform.
              </p>
              <button
                className="ml-auto bg-black px-3 py-1.5 text-white rounded-lg mt-2"
                type="button"
                onClick={async () => {
                  setLoading(true);
                  window.scrollTo(0, 0);
                  const link = await getStripeStandardAccountLink(
                    user.userId,
                    getUrlWithCurrentHostname("/organiser"),
                    getRefreshAccountLinkUrl()
                  );
                  router.push(link);
                }}
              >
                Register
              </button>
            </div>
          )}
          {/* <OrganiserSettingsAboutCard /> */}
          <h1 className="pt-20 text-3xl font-bold text-center">More features coming soon!</h1>
        </div>
      </div>
    </div>
  );
};

export default page;
