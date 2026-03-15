"use client";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefreshAccountLink() {
  const { user, userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!user.userId) {
      router.push("/error");
      return;
    }

    let isActive = true;
    const returnUrl = getUrlWithCurrentHostname("/organiser/dashboard");
    const refreshUrl = getRefreshAccountLinkUrl();

    void getStripeStandardAccountLink(user.userId, returnUrl, refreshUrl).then((link) => {
      if (isActive) {
        router.push(link);
      }
    });

    return () => {
      isActive = false;
    };
  }, [router, user.userId, userLoading]);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Loading />
    </div>
  );
}
