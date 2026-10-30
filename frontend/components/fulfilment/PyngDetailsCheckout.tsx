"use client";

import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import { EventData, EventId } from "@/interfaces/EventTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  GetFulfilmentSessionInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getEventById } from "@/services/src/events/eventsService";
import { updateFulfilmentPurchaser } from "@/services/src/fulfilment/fulfilmentServices";
import { EMAIL_VALIDATION_ERROR_MESSAGE, validateEmail } from "@/utilities/emailValidationUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const payButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:pointer-events-none";

export function canSubmitPyngDetails(name: string, email: string): boolean {
  return name.trim() !== "" && validateEmail(email);
}

type PyngDetailsCheckoutProps = {
  eventName: string;
  eventThumbnail: string | null;
  ticketName: string;
  quantity: number;
  unitPriceCents: number;
  name: string;
  email: string;
  emailError: string;
  saving: boolean;
  saveError: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function PyngDetailsCheckout({
  eventName,
  eventThumbnail,
  ticketName,
  quantity,
  unitPriceCents,
  name,
  email,
  emailError,
  saving,
  saveError,
  onNameChange,
  onEmailChange,
  onSubmit,
}: PyngDetailsCheckoutProps) {
  const lineTotalCents = unitPriceCents * quantity;
  const canPay = canSubmitPyngDetails(name, email) && !saving;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canPay) {
      onSubmit();
    }
  };

  return (
    <div className="mx-auto grid h-full min-h-0 w-full max-w-5xl grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 px-4 md:grid-cols-2 md:grid-rows-1 md:px-8">
      <section className="flex min-h-0 flex-col overflow-hidden px-5 py-4 md:px-8 md:py-6">
        <h2 className="text-sm font-medium text-foreground-muted font-sans">Order summary</h2>
        <div className="mt-4 flex items-center gap-3">
          {eventThumbnail ? (
            <Image src={eventThumbnail} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <span className="h-12 w-12 rounded-md bg-border" />
          )}
          <p className="text-sm font-semibold text-foreground font-sans">{eventName}</p>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground font-sans">{ticketName}</p>
            <p className="mt-1 text-sm text-foreground-muted font-sans">{getEventPriceDisplay(unitPriceCents)} each</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-foreground-muted font-sans">Qty {quantity}</p>
            <p className="mt-1 text-sm font-medium text-foreground font-sans">{getEventPriceDisplay(lineTotalCents)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm font-sans">
            <span className="text-foreground-muted">Subtotal</span>
            <span className="text-foreground">{getEventPriceDisplay(lineTotalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold font-sans">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{getEventPriceDisplay(lineTotalCents, true)}</span>
          </div>
        </div>
      </section>
      <form
        className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-background px-5 py-4 md:px-8 md:py-6"
        onSubmit={submit}
      >
        <h2 className="text-sm font-medium text-foreground font-sans">Contact info</h2>
        <label className="mt-4 block text-sm font-medium text-foreground font-sans" htmlFor="pyng-purchaser-name">
          Full name
        </label>
        <input
          id="pyng-purchaser-name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-sans"
        />
        <label className="mt-4 block text-sm font-medium text-foreground font-sans" htmlFor="pyng-purchaser-email">
          Email
        </label>
        <input
          id="pyng-purchaser-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-sans"
        />
        {emailError ? <p className="mt-2 text-sm text-red-600 font-sans">{emailError}</p> : null}
        {saveError ? <p className="mt-2 text-sm text-red-600 font-sans">{saveError}</p> : null}
        <button type="submit" className={`${payButtonClassName} mt-4`} disabled={!canPay}>
          <Image src="/images/pyng-mark.png" alt="" width={20} height={20} className="h-5 w-5" />
          Pay with PYNG
        </button>
      </form>
    </div>
  );
}

type DetailsFulfilmentEntityProps = {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  eventId: EventId | null;
  ticketName: string | null;
  quantity: number | null;
  unitPriceCents: number | null;
  purchaserName: string | null;
  purchaserEmail: string | null;
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
  onNext: () => Promise<void>;
  onPrev: () => Promise<void>;
};

export default function DetailsFulfilmentEntity({
  fulfilmentSessionId,
  fulfilmentEntityId,
  eventId,
  ticketName,
  quantity,
  unitPriceCents,
  purchaserName,
  purchaserEmail,
  fulfilmentSessionInfo,
  onNext,
  onPrev,
}: DetailsFulfilmentEntityProps) {
  const logger = useMemo(() => new Logger("DetailsFulfilmentEntity"), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [name, setName] = useState(purchaserName ?? "");
  const [email, setEmail] = useState(purchaserEmail ?? "");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const emailError = email.trim() === "" || validateEmail(email) ? "" : EMAIL_VALIDATION_ERROR_MESSAGE;

  const currentIndex = fulfilmentSessionInfo?.currentEntityIndex ?? 0;
  const isFirstEntity = currentIndex === 0;

  useEffect(() => {
    if (!eventId) {
      logger.error("Details fulfilment entity is missing an event id");
      router.push("/error");
      return;
    }
    let cancelled = false;
    getEventById(eventId)
      .then((event) => {
        if (!cancelled) {
          setEventData(event);
          setLoading(false);
        }
      })
      .catch((error) => {
        logger.error(`Failed to load event ${eventId}: ${error}`);
        if (!cancelled) {
          router.push("/error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, logger, router]);

  const onPay = async () => {
    if (!canSubmitPyngDetails(name, email)) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await updateFulfilmentPurchaser(fulfilmentSessionId, fulfilmentEntityId, name.trim(), email.trim());
      await onNext();
    } catch (error) {
      logger.error(`Failed to save purchaser details: ${error}`);
      setSaveError("Could not save your details. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <FulfilmentEntityPage
      onPrev={onPrev}
      showPrevButton={!isFirstEntity}
      showNextButton={false}
      fulfilmentSessionInfo={fulfilmentSessionInfo}
      fulfilmentSessionId={fulfilmentSessionId}
      fitScreen
    >
      <PyngDetailsCheckout
        eventName={eventData?.name || "Event"}
        eventThumbnail={eventData?.thumbnail || null}
        ticketName={ticketName?.trim() || "Ticket"}
        quantity={quantity ?? 0}
        unitPriceCents={unitPriceCents ?? 0}
        name={name}
        email={email}
        emailError={emailError}
        saving={saving}
        saveError={saveError}
        onNameChange={setName}
        onEmailChange={setEmail}
        onSubmit={() => {
          void onPay();
        }}
      />
    </FulfilmentEntityPage>
  );
}
