"use client";

import Image from "@/components/elements/AppImage";
import { PaymentProvider } from "@/interfaces/FulfilmentTypes";
import { EventHubPanel } from "./EventHubPanel";
import { EventHubSettingTile, EventHubSettingTileRow } from "./EventHubStage";

const PROVIDER_OPTIONS: { provider: PaymentProvider; title: string; logo: string }[] = [
  { provider: PaymentProvider.STRIPE, title: "Stripe", logo: "/images/stripe-mark.svg" },
  { provider: PaymentProvider.PYNG, title: "PYNG", logo: "/images/pyng-mark.png" },
];

export function paymentProvidersLabel(providers: PaymentProvider[]): string {
  return PROVIDER_OPTIONS.filter(({ provider }) => providers.includes(provider))
    .map(({ title }) => title)
    .join(", ");
}

type PaymentProvidersPanelProps = {
  open: boolean;
  onClose: () => void;
  supportedPaymentProviders: PaymentProvider[];
  /** Providers the organiser account may offer. Enabled providers can always be turned off. */
  organiserPaymentProviders: PaymentProvider[];
  disabled?: boolean;
  onChange: (next: PaymentProvider[]) => void;
};

export function PaymentProvidersPanel({
  open,
  onClose,
  supportedPaymentProviders,
  organiserPaymentProviders,
  disabled,
  onChange,
}: PaymentProvidersPanelProps) {
  const toggle = (provider: PaymentProvider, enable: boolean) => {
    onChange(
      PROVIDER_OPTIONS.map((option) => option.provider).filter((p) =>
        p === provider ? enable : supportedPaymentProviders.includes(p)
      )
    );
  };

  return (
    <EventHubPanel open={open} onClose={onClose} title="Payment providers">
      <p className="text-sm text-foreground-secondary font-sans leading-relaxed">
        Choose how customers can pay for tickets. At least one provider must stay on.
      </p>
      <EventHubSettingTileRow>
        {PROVIDER_OPTIONS.map(({ provider, title, logo }) => {
          const checked = supportedPaymentProviders.includes(provider);
          const isLastEnabled = checked && supportedPaymentProviders.length === 1;
          const available = checked || organiserPaymentProviders.includes(provider);
          return (
            <EventHubSettingTile
              key={provider}
              title={title}
              description={available ? undefined : `${title} is not enabled for your account.`}
              icon={<Image src={logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />}
              tone="stripe"
              checked={checked}
              disabled={disabled || isLastEnabled || !available}
              onChange={(next) => toggle(provider, next)}
            />
          );
        })}
      </EventHubSettingTileRow>
      {!organiserPaymentProviders.includes(PaymentProvider.PYNG) ? (
        <p className="mt-3 text-xs text-foreground-muted font-sans leading-relaxed">
          PYNG is not enabled for your account yet. Contact SPORTSHUB to set it up.
        </p>
      ) : null}
    </EventHubPanel>
  );
}
