import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

export default function StripeSetup(props: { userId: string; setLoading: Dispatch<SetStateAction<boolean>> }) {
  const router = useRouter();

  return (
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
          props.setLoading(true);
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
      </button>
    </div>
  );
}
