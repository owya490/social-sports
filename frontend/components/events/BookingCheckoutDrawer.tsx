"use client";

import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { EventTicketType } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, PaymentProvider } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { isPayWithPyngEnabled } from "@/services/featureFlags";
import { getEventPriceDisplay, isFreeEvent } from "@/utilities/priceUtils";
import Image from "next/image";
import { OrganiserPill } from "./OrganiserPill";

const PYNG_SIGNUP_URL = "https://pyng.com.au/customer-referral?referralCode=6YNCMZ";

const creditCardButtonClassName =
  "inline-flex w-full items-center justify-center rounded-xl border border-foreground bg-foreground px-4 py-2.5 text-sm font-semibold text-background font-sans hover:bg-background hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:pointer-events-none";

const pyngButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:pointer-events-none";

export function offersPaymentChoice(unitPriceCents: number | undefined): boolean {
  return unitPriceCents !== undefined && !isFreeEvent(unitPriceCents);
}

type BookingCheckoutLineProps = {
  eventName?: string;
  organiser?: PublicUserData;
  eventDate?: string;
  eventTicketType?: EventTicketType | null;
  quantity: number;
};

type BookingCheckoutActionsProps = {
  onPay: (provider: PaymentProvider) => void;
  supportedPaymentProviders?: PaymentProvider[] | null;
  bookingApprovalEnabled?: boolean;
};

export function BookingCheckoutSummary({
  eventName,
  organiser,
  eventDate,
  eventTicketType,
  quantity,
}: BookingCheckoutLineProps) {
  const lineName = eventTicketType?.name.trim() || "Ticket";
  const unitPriceCents = eventTicketType?.price ?? 0;
  const lineTotalCents = unitPriceCents * quantity;

  return (
    <div>
      {eventName ? (
        <div className="mb-4">
          <p className="text-base font-semibold text-foreground font-sans tracking-tight">{eventName}</p>
          {organiser || eventDate ? (
            <div className="mt-2 flex items-center">
              {organiser ? <OrganiserPill organiser={organiser} /> : null}
              {organiser && eventDate ? (
                <span className="mr-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden />
              ) : null}
              {eventDate ? <p className="text-sm text-gray-700">{eventDate}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground font-sans">{lineName}</p>
          <p className="mt-1 text-sm text-foreground-muted font-sans">{getEventPriceDisplay(unitPriceCents)} each</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm text-foreground-muted font-sans">Qty {quantity}</p>
          <p className="mt-1 text-sm font-medium text-foreground font-sans">{getEventPriceDisplay(lineTotalCents)}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-semibold text-foreground font-sans">Total</p>
        <p className="text-sm font-semibold text-foreground font-sans">{getEventPriceDisplay(lineTotalCents, true)}</p>
      </div>
    </div>
  );
}

export function BookingCheckoutActions({
  onPay,
  supportedPaymentProviders,
  bookingApprovalEnabled = false,
}: BookingCheckoutActionsProps) {
  const providers = supportedPaymentProviders ?? EmptyEventData.supportedPaymentProviders;
  const stripeSupported = providers.includes(PaymentProvider.STRIPE);
  const pyngEnabled = isPayWithPyngEnabled();

  return (
    <div className="flex flex-col gap-2">
      {stripeSupported ? (
        <button type="button" className={creditCardButtonClassName} onClick={() => onPay(PaymentProvider.STRIPE)}>
          {bookingApprovalEnabled ? "Book with Card" : "Pay with Card"}
        </button>
      ) : null}
      <button
        type="button"
        className={pyngButtonClassName}
        disabled={!pyngEnabled}
        onClick={() => onPay(PaymentProvider.PYNG)}
      >
        <Image src="/images/pyng-mark.png" alt="" width={20} height={20} className="h-5 w-5" />
        {pyngEnabled ? "Pay with PYNG" : "Pay with Pyng - Coming Soon..."}
      </button>
      <p className="text-xs font-sans leading-5 text-foreground-muted">
        No Processing Fees with Pyng.{" "}
        <span className="md:hidden">Save 50c every payment.</span>
        <span className="hidden md:inline">Uses PayTo, save 50c every payment.</span>{" "}
        <a
          href={PYNG_SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}

type BookingCheckoutDrawerProps = BookingCheckoutLineProps &
  BookingCheckoutActionsProps & {
    open: boolean;
    onClose: () => void;
  };

export default function BookingCheckoutDrawer({
  open,
  onClose,
  eventName,
  organiser,
  eventDate,
  eventTicketType,
  quantity,
  onPay,
  supportedPaymentProviders,
  bookingApprovalEnabled = false,
}: BookingCheckoutDrawerProps) {
  return (
    <EventHubPanel
      open={open}
      onClose={onClose}
      title="Checkout"
      footer={
        <BookingCheckoutActions
          onPay={onPay}
          supportedPaymentProviders={supportedPaymentProviders}
          bookingApprovalEnabled={bookingApprovalEnabled}
        />
      }
    >
      <BookingCheckoutSummary
        eventName={eventName}
        organiser={organiser}
        eventDate={eventDate}
        eventTicketType={eventTicketType}
        quantity={quantity}
      />
    </EventHubPanel>
  );
}
