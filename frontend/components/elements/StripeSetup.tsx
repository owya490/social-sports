import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { HighlightButton } from "./HighlightButton";

export default function StripeSetup(props: { userId: string; setLoading?: Dispatch<SetStateAction<boolean>> }) {
  const router = useRouter();

  return (
    <div className="p-8 border-2 border-organiser-darker-light-gray rounded-3xl flex-col flex">
      <h2 className="font-bold text-xl mb-2">Connect your Stripe Account now!</h2>
      <p className="">Leverage the ability to take bookings and payments right through the platform.</p>
      <HighlightButton
        className="ml-auto "
        onClick={async () => {
          props.setLoading?.(true);
          window.scrollTo(0, 0);
          const link = await getStripeStandardAccountLink(
            props.userId,
            getUrlWithCurrentHostname("/organiser"),
            getRefreshAccountLinkUrl()
          );
          router.push(link);
        }}
      >
        Register
      </HighlightButton>
    </div>
  );
}
