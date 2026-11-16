"use client";

import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";
import { SportshubStripeIntegrationIcon } from "@/components/organiser/v2/settings/SportshubStripeIntegrationIcon";
import { ProfileField, ProfileTextInput, profileFieldClass, profileFieldShellClass } from "@/components/users/profile/ProfileFormControls";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import { initializeAutocomplete, useGoogleMapsScript } from "@/services/src/maps/mapsService";
import { startStripePayoutOnboarding } from "@/services/src/stripe/stripeService";
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

function AbnChoice({
  checked,
  label,
  disabled,
  onSelect,
}: {
  checked: boolean;
  label: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="radio" name="has-abn" className="sr-only" checked={checked} onChange={onSelect} disabled={disabled} />
      <span
        aria-hidden
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          checked ? "border-black" : "border-gray-400"
        }`}
      >
        {checked ? <span className="h-2 w-2 rounded-full bg-black" /> : null}
      </span>
      {label}
    </label>
  );
}

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

export default function OrganiserOnboardingStep({
  onBack,
  onFinished,
}: {
  onBack: () => void;
  onFinished: () => Promise<void>;
}) {
  const { user } = useUser();
  const [hasAbn, setHasAbn] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.surname || "");
  const [email, setEmail] = useState(user.publicContactInformation?.email || user.contactInformation?.email || "");
  const [abn, setAbn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [address, setAddress] = useState<ParsedAddress | null>(null);
  const [accountHolderName, setAccountHolderName] = useState(`${user.firstName || ""} ${user.surname || ""}`.trim());
  const [bsb, setBsb] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptLoadResult = useGoogleMapsScript();
  const mapsLoaded = scriptLoadResult?.isLoaded === true;

  useEffect(() => {
    if (!mapsLoaded || !addressInputRef.current) return;
    autocompleteRef.current = initializeAutocomplete(addressInputRef, () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place) return;
      const parsed = parsePlace(place);
      setAddress(parsed);
      setAddressQuery(place.formatted_address || parsed?.line1 || "");
      setFieldError(parsed ? "" : "Choose an Australian street address from the suggestions.");
    });
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [mapsLoaded]);

  const skipGettingPaid = async () => {
    if (!user.userId || skipBusy || submitting) return;
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

  const submitPayouts = async (event: FormEvent) => {
    event.preventDefault();
    if (!user.userId || submitting || skipBusy) return;
    setFieldError("");
    setFormError("");

    const phone = user.publicContactInformation?.mobile || user.contactInformation?.mobile || "";
    if (!firstName.trim() || !lastName.trim()) {
      setFieldError("Enter your legal name.");
      return;
    }
    if (!validateEmail(email)) {
      setFieldError(EMAIL_VALIDATION_ERROR_MESSAGE);
      return;
    }
    if (!phone.trim()) {
      setFieldError("Add a phone number on your profile. Stripe needs it for payouts.");
      return;
    }
    if (hasAbn && !isValidAbn(abn)) {
      setFieldError("Enter a valid 11-digit ABN.");
      return;
    }
    if (!dateOfBirth) {
      setFieldError("Enter your date of birth.");
      return;
    }
    if (!address) {
      setFieldError("Choose an Australian street address from the suggestions.");
      return;
    }
    if (digits(bsb).length !== 6 || digits(accountNumber).length < 5) {
      setFieldError("Enter a 6-digit BSB and your account number.");
      return;
    }

    setSubmitting(true);
    try {
      const url = await startStripePayoutOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone,
        hasAbn,
        abn: hasAbn ? digits(abn) : undefined,
        dateOfBirth,
        addressLine1: address.line1,
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        accountHolderName: accountHolderName.trim() || `${firstName.trim()} ${lastName.trim()}`,
        bsb: digits(bsb),
        accountNumber: digits(accountNumber),
      });
      try {
        await markProductOnboardingCompleted(user.userId as UserId);
      } catch {
        // The Stripe link is single-use, so still send them on if saving completion fails.
      }
      window.location.assign(url);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not start Stripe. Try again.");
      setSubmitting(false);
    }
  };

  const busy = submitting || skipBusy;
  const canFinish =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    validateEmail(email) &&
    dateOfBirth !== "" &&
    address !== null &&
    accountHolderName.trim() !== "" &&
    digits(bsb).length === 6 &&
    digits(accountNumber).length >= 5 &&
    digits(accountNumber).length <= 10 &&
    (!hasAbn || isValidAbn(abn));

  return (
    <form className="flex flex-col items-center" onSubmit={(event) => void submitPayouts(event)}>
      <header className="flex w-full flex-col items-center text-center">
        <SportshubStripeIntegrationIcon />
        <h1 className="mt-4 whitespace-nowrap text-3xl font-bold tracking-tight">Getting paid</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-600 sm:text-base">
          Add your payout details. Stripe will ask you to review them and accept its agreement.
        </p>
      </header>

      <div className="mt-10 w-full space-y-4 text-left">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-core-text">Do you have an ABN?</legend>
          <div className="flex gap-4 text-sm">
            <AbnChoice checked={hasAbn} label="Yes" disabled={busy} onSelect={() => setHasAbn(true)} />
            <AbnChoice checked={!hasAbn} label="No" disabled={busy} onSelect={() => setHasAbn(false)} />
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="Legal first name" htmlFor="payout-first-name">
            <ProfileTextInput id="payout-first-name" value={firstName} onChange={setFirstName} autoComplete="given-name" disabled={busy} />
          </ProfileField>
          <ProfileField label="Legal last name" htmlFor="payout-last-name">
            <ProfileTextInput id="payout-last-name" value={lastName} onChange={setLastName} autoComplete="family-name" disabled={busy} />
          </ProfileField>
          <ProfileField label="Email" htmlFor="payout-email" className="sm:col-span-2">
            <ProfileTextInput id="payout-email" type="email" value={email} onChange={setEmail} autoComplete="email" disabled={busy} />
          </ProfileField>
          {hasAbn ? (
            <ProfileField label="ABN" htmlFor="payout-abn" hint="Stripe will ask for the rest of your business details." className="sm:col-span-2">
              <ProfileTextInput id="payout-abn" value={abn} onChange={setAbn} inputMode="numeric" disabled={busy} />
            </ProfileField>
          ) : null}
          <ProfileField label="Date of birth" htmlFor="payout-dob">
            <ProfileTextInput id="payout-dob" type="date" value={dateOfBirth} onChange={setDateOfBirth} autoComplete="bday" disabled={busy} />
          </ProfileField>
          <ProfileField label="Address" htmlFor="payout-address" className="sm:col-span-2">
            <div className={profileFieldShellClass}>
              <input
                id="payout-address"
                ref={addressInputRef}
                value={addressQuery}
                disabled={busy}
                autoComplete="off"
                placeholder="Start typing your address"
                onChange={(event) => {
                  setAddressQuery(event.target.value);
                  setAddress(null);
                }}
                className={profileFieldClass}
              />
            </div>
          </ProfileField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-core-text sm:col-span-2">Bank account</h2>
          <ProfileField label="Account name" htmlFor="payout-account-name" className="sm:col-span-2">
            <ProfileTextInput id="payout-account-name" value={accountHolderName} onChange={setAccountHolderName} disabled={busy} />
          </ProfileField>
          <ProfileField label="BSB" htmlFor="payout-bsb">
            <ProfileTextInput id="payout-bsb" value={bsb} onChange={setBsb} inputMode="numeric" disabled={busy} />
          </ProfileField>
          <ProfileField label="Account number" htmlFor="payout-account-number">
            <ProfileTextInput id="payout-account-number" value={accountNumber} onChange={setAccountNumber} inputMode="numeric" disabled={busy} />
          </ProfileField>
        </div>

        {fieldError ? <p className="text-sm text-red-700">{fieldError}</p> : null}
        {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
      </div>

      <div className="mt-10 w-full">
        <OnboardingStepNav
          onBack={onBack}
          primaryType="submit"
          primaryLabel={submitting ? "Working…" : "Finish"}
          disabled={busy}
          primaryDisabled={!canFinish}
          skip={{ busy: skipBusy, onSkip: skipGettingPaid }}
        />
      </div>
    </form>
  );
}
