import { SportshubStripeIntegrationIcon } from "@/components/organiser/v2/settings/SportshubStripeIntegrationIcon";
import Link from "next/link";

type ConnectStripeCtaProps = {
  className?: string;
};

export function ConnectStripeCta({ className = "" }: ConnectStripeCtaProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-background px-2.5 py-2 flex gap-2.5 items-center ${className}`}
    >
      <SportshubStripeIntegrationIcon />
      <p className="min-w-0 flex-1 text-xs font-medium text-foreground leading-snug">
        Connect Stripe to take payments through SPORTSHUB.
      </p>
      <Link
        href="/organiser/v2/settings"
        className="shrink-0 inline-flex items-center rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Connect Stripe
      </Link>
    </div>
  );
}
