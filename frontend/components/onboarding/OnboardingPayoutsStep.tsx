"use client";

import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";
import { SportshubStripeIntegrationIcon } from "@/components/organiser/v2/settings/SportshubStripeIntegrationIcon";
import {
  ProfileField,
  ProfileSection,
  ProfileTextInput,
  profileFieldClass,
  profileFieldShellClass,
} from "@/components/users/profile/ProfileFormControls";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import { initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { getStripeStandardAccountLink, startStripePayoutOnboarding } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { markProductOnboardingCompleted, updateUser } from "@/services/src/users/usersService";
import { EMAIL_VALIDATION_ERROR_MESSAGE, validateEmail } from "@/utilities/emailValidationUtils";
import { hasCompletedStripeConnectSetup } from "@/utilities/onboardingUtils";
import { Timestamp } from "firebase/firestore";
import { FormEvent, useEffect, useRef, useState } from "react";

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

type ParsedAddress = {
  line1: string;
  city: string;
  state: string;
  postcode: string;
};

type PayoutFormState = {
  hasAbn: boolean;
  firstName: string;
  lastName: string;
  email: string;
  abn: string;
  dateOfBirth: string;
  addressQuery: string;
  accountHolderName: string;
  bsb: string;
  accountNumber: string;
};

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidAbn(value: string): boolean {
  const abn = digits(value);
  if (abn.length !== 11) return false;
  const sum = ABN_WEIGHTS.reduce((total, weight, index) => {
    const digit = Number(abn[index]) - (index === 0 ? 1 : 0);
    return total + digit * weight;
  }, 0);
  return sum % 89 === 0;
}

function addressPart(place: google.maps.places.PlaceResult, type: string, shortName = false): string {
  const part = place.address_components?.find((component) => component.types.includes(type));
  if (!part) return "";
  return shortName ? part.short_name : part.long_name;
}

function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress | null {
  const street = [addressPart(place, "street_number"), addressPart(place, "route")].filter(Boolean).join(" ");
  const line1 = street || place.formatted_address?.split(",")[0]?.trim() || "";
  const city =
    addressPart(place, "locality") ||
    addressPart(place, "postal_town") ||
    addressPart(place, "sublocality_level_1");
  const state = addressPart(place, "administrative_area_level_1", true);
  const postcode = digits(addressPart(place, "postal_code"));
  if (!line1 || !city || !AU_STATES.includes(state) || postcode.length !== 4) return null;
  return { line1, city, state, postcode };
}

export default function OnboardingPayoutsStep({
  onBack,
  onFinished,
}: {
  onBack: () => void;
  onFinished: () => Promise<void>;
}) {
  const { user } = useUser();
  const [form, setForm] = useState<PayoutFormState>(() => ({
    hasAbn: false,
    firstName: user.firstName || "",
    lastName: user.surname || "",
    email: user.publicContactInformation?.email || user.contactInformation?.email || "",
    abn: "",
    dateOfBirth: "",
    addressQuery: "",
    accountHolderName: `${user.firstName || ""} ${user.surname || ""}`.trim(),
    bsb: "",
    accountNumber: "",
  }));
  const [address, setAddress] = useState<ParsedAddress | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [existingStripeBusy, setExistingStripeBusy] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptLoadResult = useGoogleMapsScript();
  const mapsLoaded = scriptLoadResult?.isLoaded === true;

  const updateField = <K extends keyof PayoutFormState>(key: K, value: PayoutFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMessage("");
  };

  useEffect(() => {
    if (!mapsLoaded || !addressInputRef.current) return;
    autocompleteRef.current = initializeAutocomplete(addressInputRef, () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place) return;
      const parsed = parsePlace(place);
      setAddress(parsed);
      setForm((prev) => ({ ...prev, addressQuery: place.formatted_address || parsed?.line1 || "" }));
      setErrorMessage(parsed ? "" : "Choose an Australian street address from the suggestions.");
    });
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsLoaded]);

  const busy = submitting || skipBusy || existingStripeBusy;

  const connectExistingStripe = async () => {
    if (!user.userId || busy) return;
    setErrorMessage("");
    setExistingStripeBusy(true);
    try {
      const link = await getStripeStandardAccountLink(
        user.userId,
        getUrlWithCurrentHostname("/organiser/v2/settings"),
        getRefreshAccountLinkUrl()
      );
      if (!link || link === "/error") {
        setErrorMessage("Could not open Stripe. Try again.");
        setExistingStripeBusy(false);
        return;
      }
      try {
        await markProductOnboardingCompleted(user.userId as UserId);
      } catch {
        // The Stripe link is single-use, so still send them on if saving completion fails.
      }
      window.location.assign(link);
    } catch {
      setErrorMessage("Could not open Stripe. Try again.");
      setExistingStripeBusy(false);
    }
  };

  const skipGettingPaid = async () => {
    if (!user.userId || busy) return;
    setSkipBusy(true);
    try {
      if (!hasCompletedStripeConnectSetup(user) && user.stripeConnectSetupSkippedAt == null) {
        await updateUser(user.userId, { stripeConnectSetupSkippedAt: Timestamp.now() });
      }
      await markProductOnboardingCompleted(user.userId as UserId);
      await onFinished();
    } finally {
      setSkipBusy(false);
    }
  };

  const validatePayoutForm = (phone: string): string | null => {
    if (!form.firstName.trim() || !form.lastName.trim()) return "Enter your legal name.";
    if (!validateEmail(form.email)) return EMAIL_VALIDATION_ERROR_MESSAGE;
    if (!phone.trim()) return "Add a phone number on your profile. Stripe needs it for payouts.";
    if (form.hasAbn && !isValidAbn(form.abn)) return "Enter a valid 11-digit ABN.";
    if (!form.dateOfBirth) return "Enter your date of birth.";
    if (!address) return "Choose an Australian street address from the suggestions.";
    if (digits(form.bsb).length !== 6 || digits(form.accountNumber).length < 5) {
      return "Enter a 6-digit BSB and your account number.";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user.userId || busy) return;
    setErrorMessage("");

    const phone = user.publicContactInformation?.mobile || user.contactInformation?.mobile || "";
    const validationError = validatePayoutForm(phone);
    if (validationError || !address) {
      setErrorMessage(validationError || "Choose an Australian street address from the suggestions.");
      return;
    }

    setSubmitting(true);
    try {
      const url = await startStripePayoutOnboarding({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone,
        hasAbn: form.hasAbn,
        abn: form.hasAbn ? digits(form.abn) : undefined,
        dateOfBirth: form.dateOfBirth,
        addressLine1: address.line1,
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        accountHolderName: form.accountHolderName.trim() || `${form.firstName.trim()} ${form.lastName.trim()}`,
        bsb: digits(form.bsb),
        accountNumber: digits(form.accountNumber),
      });
      try {
        await markProductOnboardingCompleted(user.userId as UserId);
      } catch {
        // The Stripe link is single-use, so still send them on if saving completion fails.
      }
      window.location.assign(url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not start Stripe. Try again.");
      setSubmitting(false);
    }
  };

  const canFinish =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    validateEmail(form.email) &&
    form.dateOfBirth !== "" &&
    address !== null &&
    form.accountHolderName.trim() !== "" &&
    digits(form.bsb).length === 6 &&
    digits(form.accountNumber).length >= 5 &&
    digits(form.accountNumber).length <= 10 &&
    (!form.hasAbn || isValidAbn(form.abn));

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start gap-3">
        <SportshubStripeIntegrationIcon />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Getting paid</h1>
          <p className="mt-1.5 text-sm text-foreground-secondary sm:text-base">
            Add your payout details. Stripe will ask you to review them and accept its agreement.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void connectExistingStripe()}
            className="mt-2 inline-block text-left text-xs font-medium text-foreground-secondary underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
          >
            {existingStripeBusy ? "Opening Stripe…" : "I have an existing Stripe account"}
          </button>
        </div>
      </header>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        <ProfileSection title="Identity and business" description="Used by Stripe to verify who receives payouts.">
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-foreground-muted">Do you have an ABN?</legend>
            <div role="radiogroup" aria-label="Do you have an ABN?" className="inline-flex rounded-xl bg-surface p-1">
              {[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ].map((option) => {
                const selected = form.hasAbn === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={busy}
                    onClick={() => updateField("hasAbn", option.value)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50 ${
                      selected ? "bg-foreground text-background" : "text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Legal first name" htmlFor="payout-first-name">
              <ProfileTextInput
                id="payout-first-name"
                value={form.firstName}
                onChange={(v) => updateField("firstName", v)}
                autoComplete="given-name"
                disabled={busy}
              />
            </ProfileField>
            <ProfileField label="Legal last name" htmlFor="payout-last-name">
              <ProfileTextInput
                id="payout-last-name"
                value={form.lastName}
                onChange={(v) => updateField("lastName", v)}
                autoComplete="family-name"
                disabled={busy}
              />
            </ProfileField>
            <ProfileField label="Email" htmlFor="payout-email" className="sm:col-span-2">
              <ProfileTextInput
                id="payout-email"
                type="email"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                autoComplete="email"
                disabled={busy}
              />
            </ProfileField>
            {form.hasAbn ? (
              <ProfileField
                label="ABN"
                htmlFor="payout-abn"
                hint="Stripe will ask for the rest of your business details."
                className="sm:col-span-2"
              >
                <ProfileTextInput
                  id="payout-abn"
                  value={form.abn}
                  onChange={(v) => updateField("abn", v)}
                  inputMode="numeric"
                  disabled={busy}
                />
              </ProfileField>
            ) : null}
            <ProfileField label="Date of birth" htmlFor="payout-dob">
              <ProfileTextInput
                id="payout-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(v) => updateField("dateOfBirth", v)}
                autoComplete="bday"
                disabled={busy}
              />
            </ProfileField>
            <ProfileField label="Address" htmlFor="payout-address" className="sm:col-span-2">
              <div className={profileFieldShellClass}>
                <input
                  id="payout-address"
                  ref={addressInputRef}
                  value={form.addressQuery}
                  disabled={busy}
                  autoComplete="off"
                  placeholder="Start typing your address"
                  onChange={(event) => {
                    updateField("addressQuery", event.target.value);
                    setAddress(null);
                  }}
                  className={profileFieldClass}
                />
              </div>
            </ProfileField>
          </div>
        </ProfileSection>

        <ProfileSection title="Bank account" description="Where ticket payouts are sent.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="Account name" htmlFor="payout-account-name" className="sm:col-span-2">
              <ProfileTextInput
                id="payout-account-name"
                value={form.accountHolderName}
                onChange={(v) => updateField("accountHolderName", v)}
                disabled={busy}
              />
            </ProfileField>
            <ProfileField label="BSB" htmlFor="payout-bsb">
              <ProfileTextInput
                id="payout-bsb"
                value={form.bsb}
                onChange={(v) => updateField("bsb", v)}
                inputMode="numeric"
                disabled={busy}
              />
            </ProfileField>
            <ProfileField label="Account number" htmlFor="payout-account-number">
              <ProfileTextInput
                id="payout-account-number"
                value={form.accountNumber}
                onChange={(v) => updateField("accountNumber", v)}
                inputMode="numeric"
                disabled={busy}
              />
            </ProfileField>
          </div>
        </ProfileSection>

        {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}

        <OnboardingStepNav
          onBack={onBack}
          primaryType="submit"
          primaryLabel={submitting ? "Working…" : "Finish"}
          disabled={busy}
          primaryDisabled={!canFinish}
          skip={{ busy: skipBusy, onSkip: skipGettingPaid }}
        />
      </form>
    </div>
  );
}
