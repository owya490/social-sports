"use client";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData } from "@/interfaces/UserTypes";
import { isLoggedIn } from "@/services/src/auth/authService";
import { getStripeStandardAccounLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefreshAccountLink() {
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    // If user is not logged in, cannot activate RefreshAccountLink as will trigger error.
    if (!isLoggedIn() && user === EmptyUserData) {
      router.push("/error");
    }
    const returnUrl = getUrlWithCurrentHostname("/organiser");
    const refreshUrl = getRefreshAccountLinkUrl();
    getStripeStandardAccounLink(user.userId, returnUrl, refreshUrl).then((link) => {
      router.push(link);
    });
  }, []);
  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Loading />
    </div>
  );
}
