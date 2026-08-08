import SportshubLogo from "@/public/images/sportshub-mark.svg";
import StripeIcon from "@/public/images/stripe-icon.png";
import Image from "next/image";

type SportshubStripeIntegrationIconProps = {
  className?: string;
};

/**
 * Side-by-side Sportshub + Stripe circles with a small plus at the join.
 */
export function SportshubStripeIntegrationIcon({ className = "" }: SportshubStripeIntegrationIconProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center ${className}`}
      role="img"
      aria-label="SPORTSHUB connected with Stripe"
    >
      <div className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black p-1.5">
        <Image
          src={SportshubLogo}
          alt=""
          width={32}
          height={32}
          className="h-full w-full object-contain"
          aria-hidden
        />
      </div>

      <div className="relative z-10 ml-0.5 h-10 w-10 overflow-hidden rounded-full bg-[#635BFF]">
        <Image src={StripeIcon} alt="" fill className="object-cover" sizes="40px" aria-hidden />
      </div>

      <div
        className="absolute left-1/2 top-1/2 z-20 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2.5v7M2.5 6h7" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
