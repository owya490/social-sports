// BasicInformation.tsx

import LocationAutocompleteForm from "@/components/utility/AutoComplete";
import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS } from "@/services/src/stripe/stripeConstants";
import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { centsToDollars, dollarsToCents } from "@/utilities/priceUtils";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { Switch } from "@mantine/core";
import { Input, Option, Select } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CreateEventCostSlider from "../CreateEventCostSlider";
import CustomDateInput from "../CustomDateInput";
import CustomTimeInput from "../CustomTimeInput";
import { FormWrapper } from "./FormWrapper";
import { RecurringEventsForm } from "./RecurringEventsForm";
import "./form.css";

const logger = new Logger("BasicForm");

export type BasicData = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  sport: string;
  price: number; // Price is stored in cents, e.g. 1567 will be $15.67
  capacity: number;
  isPrivate: boolean;
  paymentsActive: boolean;
  lat: number;
  lng: number;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  waitlistEnabled: boolean;
  eventLink: string;
  newRecurrenceData: NewRecurrenceFormData;
};

type BasicInformationProps = BasicData & {
  user: UserData;
  updateField: (fields: Partial<BasicData>) => void;
  setLoading: (value: boolean) => void;
  setHasError: (value: boolean) => void;
};

export const STRIPE_MIN_PRICE_ERROR_MESSAGE = `Price cannot be below $${(
  MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS / 100
).toFixed(2)}`;

const validatePrice = (amount: number): string | null => {
  if (amount > 0 && amount < MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS / 100) {
    return STRIPE_MIN_PRICE_ERROR_MESSAGE;
  }
  return null;
};

export function BasicInformation({
  name,
  location,
  startDate,
  endDate,
  registrationEndDate,
  startTime,
  endTime,
  registrationEndTime,
  sport,
  price,
  capacity,
  isPrivate,
  paymentsActive,
  user,
  stripeFeeToCustomer,
  promotionalCodesEnabled,
  waitlistEnabled,
  eventLink,
  newRecurrenceData,
  updateField,
  setLoading,
  setHasError,
}: BasicInformationProps) {
  const router = useRouter();
  const [hasLocationError, setHasLocationError] = useState<boolean>(false);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [isAdditionalSettingsOpen, setIsAdditionalSettingsOpen] = useState(false);
  const [customRegistrationDeadlineEnabled, setCustomRegistrationDeadlineEnabled] = useState(false);
  const [error, setError] = useState("");

  const validateURL = (url: string | URL) => {
    try {
      new URL(url); // Checks if the string is a valid URL
      return true;
    } catch {
      return false;
    }
  };

  // get response for the url

  const handleChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    updateField({ eventLink: value });

    if (!validateURL(value)) {
      setError("Please enter a valid URL.");
    } else {
      setError("");
    }
  };

  const handlePrivacyChange = (value: string) => {
    if (value === "Public") {
      updateField({ isPrivate: false });
    }
    if (value === "Private") {
      updateField({ isPrivate: true });
    }
  };

  const handleStartDateChange = (selectedDate: string) => {
    updateField({ startDate: selectedDate });
    if (!customRegistrationDeadlineEnabled) {
      handleRegistrationEndDateChange(selectedDate);
    }
  };

  const handleEndDateChange = (selectedDate: string) => {
    updateField({ endDate: selectedDate });
  };

  const handleRegistrationEndDateChange = (selectedDate: string) => {
    updateField({ registrationEndDate: selectedDate });
  };

  useEffect(() => {
    updateField({ endDate: startDate });
  }, [startDate]);

  const handleStartTimeChange = (selectedTime: string) => {
    updateField({ startTime: selectedTime });
    if (!customRegistrationDeadlineEnabled) {
      handleRegistrationEndTimeChange(selectedTime);
    }
  };

  const handleEndTimeChange = (selectedTime: string) => {
    updateField({ endTime: selectedTime });
  };

  const handleCustomRegistrationDeadlineEnabled = (enabled: boolean) => {
    if (!enabled) {
      handleRegistrationEndDateChange(startDate);
      handleRegistrationEndTimeChange(startTime);
    }
    setCustomRegistrationDeadlineEnabled(enabled);
  };

  const handleRegistrationEndTimeChange = (selectedTime: string) => {
    updateField({ registrationEndTime: selectedTime });
  };

  const handleStripeFeesToCustomerChange = (value: string) => {
    updateField({
      stripeFeeToCustomer: value === "Yes",
    });
  };

  const handlePromotionalCodesEnabledChange = (value: string) => {
    updateField({
      promotionalCodesEnabled: value === "Yes",
    });
  };

  const handleWaitlistEnabledChange = (value: string) => {
    updateField({
      waitlistEnabled: value === "Yes",
    });
  };

  const [customAmount, setCustomAmount] = useState(centsToDollars(price));

  const handleCustomAmountChange = (amount: number) => {
    amount = Number.isNaN(amount) ? 0 : amount;
    setCustomAmount(amount);
    updateField({ price: dollarsToCents(amount) }); // Update the cost field in the parent component
  };

  useEffect(() => {
    const validateErrors = () => {
      const currentDateTime = new Date();
      const selectedStartDateTime = new Date(`${startDate}T${startTime}`);
      const selectedEndDateTime = new Date(`${endDate}T${endTime}`);
      const selectedRegistrationEndDateTime = new Date(`${registrationEndDate}T${registrationEndTime}`);

      let hasDateError = false;

      if (currentDateTime > selectedStartDateTime) {
        setDateWarning("Event start date and time is in the past!");
        hasDateError = true;
      } else {
        setDateWarning(null);
      }

      if (selectedEndDateTime < selectedStartDateTime) {
        setTimeWarning("Event must end after it starts!");
        hasDateError = true;
      } else {
        setTimeWarning(null);
      }

      if (currentDateTime > selectedRegistrationEndDateTime) {
        setDateWarning("Event registration end date and time is in the past!");
        hasDateError = true;
      }

      if (selectedRegistrationEndDateTime > selectedEndDateTime) {
        setDateWarning("Event registration end date and time is after the event!");
        hasDateError = true;
      }

      const priceValidationError = validatePrice(customAmount);
      setPriceWarning(priceValidationError);
      let hasPriceError = priceValidationError !== null;
      if (priceInputRef.current) {
        if (hasPriceError) {
          priceInputRef.current.setCustomValidity(STRIPE_MIN_PRICE_ERROR_MESSAGE);
        } else {
          priceInputRef.current.setCustomValidity("");
        }
      }

      const hasNameError = name.trim() === "";
      if (hasDateError || hasPriceError || hasLocationError || hasNameError) {
        setHasError(true);
      } else {
        setHasError(false);
      }
    };
    validateErrors();
  }, [
    startDate,
    startTime,
    endDate,
    endTime,
    registrationEndDate,
    registrationEndTime,
    customAmount,
    location,
    name,
    hasLocationError,
  ]);

  const handlePaymentsActiveChange = (paymentsActive: string) => {
    updateField({ paymentsActive: paymentsActive.toLowerCase() === "true" });
  };

  return (
    <FormWrapper>
      <div className="space-y-12">
        <div>
          <label className="text-black text-lg font-semibold">What’s the name of your event?</label>
          <p className="text-sm mb-5 mt-2">
            This will be your event&apos;s title. Your title will be used to help create your event&apos;s summary,
            description, category, and tags – so be specific!
          </p>
          <Input
            label="Event Name"
            crossOrigin={undefined}
            required
            value={name}
            onChange={(e) => updateField({ name: e.target.value })}
            className="rounded-md focus:ring-0"
            size="lg"
            maxLength={100}
          />
        </div>
        <div>
          <label className="text-black text-lg font-semibold">When does your event start and end?</label>
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-2 mt-4">
            <div className="basis-1/3">
              <CustomDateInput
                date={startDate}
                placeholder="Start Date"
                handleChange={handleStartDateChange}
                errorMessage={dateWarning?.includes("start date") ? dateWarning : ""}
              />
            </div>
            <div className="basis-1/4">
              <CustomTimeInput
                value={startTime}
                placeholder="Start Time"
                handleChange={handleStartTimeChange}
                errorMessage={dateWarning?.includes("start date") ? dateWarning : ""}
              />
            </div>
            <div className="basis-1/3">
              <CustomDateInput
                date={endDate}
                placeholder="End Date"
                handleChange={handleEndDateChange}
                errorMessage={dateWarning?.includes("end date") ? dateWarning : timeWarning ?? ""}
              />
            </div>
            <div className="basis-1/4">
              <CustomTimeInput
                value={endTime}
                placeholder="End Time"
                handleChange={handleEndTimeChange}
                errorMessage={timeWarning || ""}
              />
            </div>
          </div>
          {dateWarning && <div className="text-red-600 text-sm mt-2">{dateWarning}</div>}
          {timeWarning && <div className="text-red-600 text-sm mt-2">{timeWarning}</div>}
          <div className="flex items-center flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-2 mt-4">
            <div>
              <Switch
                color="teal"
                label="Enable Custom Registration Deadline"
                size="sm"
                className="my-2"
                checked={customRegistrationDeadlineEnabled}
                onChange={(event) => {
                  handleCustomRegistrationDeadlineEnabled(event.currentTarget.checked);
                }}
              />
            </div>
            {customRegistrationDeadlineEnabled && (
              <>
                <div className="basis-1/3">
                  <CustomDateInput
                    date={registrationEndDate}
                    placeholder="Registration End Date"
                    handleChange={handleRegistrationEndDateChange}
                    errorMessage={dateWarning?.includes("registration") ? dateWarning : ""}
                  />
                </div>
                <div className="basis-1/3">
                  <CustomTimeInput
                    value={registrationEndTime}
                    placeholder="Registration End Time"
                    handleChange={handleRegistrationEndTimeChange}
                    errorMessage={dateWarning?.includes("registration") ? dateWarning : ""}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="text-black text-lg font-semibold">Where is it located?</label>
          <div className="mt-4">
            <LocationAutocompleteForm
              location={location}
              updateField={updateField}
              setHasLocationError={setHasLocationError}
            />
            {hasLocationError && <div className="text-red-600 text-sm mt-2">Selected location is required.</div>}
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">What sport is it?</label>
          <div className="mt-4">
            <Select
              label="Select Sport"
              size="lg"
              value={sport}
              onChange={(e) => {
                updateField({ sport: e });
              }}
            >
              {Object.entries(SPORTS_CONFIG).map((entry, idx) => {
                const sportInfo = entry[1];
                return (
                  <Option key={idx} value={sportInfo.value}>
                    {sportInfo.name}
                  </Option>
                );
              })}
            </Select>
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">What is the price of the event and max capacity?</label>
          <p className="text-sm mt-2 mb-5">
            Event price is the cost of each ticket. Event capacity is the total number of tickets you&apos;re willing to
            sell.
          </p>
          <div className="w-full px-5">
            <CreateEventCostSlider
              initialCustomAmount={customAmount}
              onCustomAmountChange={handleCustomAmountChange}
              setPriceWarning={setPriceWarning}
            />
          </div>
          <div className="w-full flex flex-col mt-8 md:flex-row md:space-x-3 my-6">
            <div className="w-full sm:w-1/2 mt-4 sm:mt-0">
              <Input
                inputRef={priceInputRef}
                label="Price"
                crossOrigin={undefined}
                value={customAmount}
                type="number"
                step=".01"
                error={!!priceWarning}
                min={0.5}
                onChange={(e) => {
                  let value = parseFloat(parseFloat(e.target.value).toFixed(2));
                  logger.debug(`Price input value: ${value}`);
                  if (isNaN(value)) {
                    value = 0;
                  }
                  handleCustomAmountChange(value);
                  setPriceWarning(validatePrice(value));
                }}
                className="rounded-md focus:ring-0"
                size="lg"
                icon={<CurrencyDollarIcon />}
              />
              {priceWarning && <div className="text-red-600 text-sm mt-2">{priceWarning}</div>}
            </div>
            <div className="w-full md:w-1/2 mt-4 md:mt-0">
              <Input
                label="Capacity"
                crossOrigin={undefined}
                required
                value={capacity}
                type="number"
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    const maxValue = Math.max(value, 0);
                    updateField({ capacity: maxValue });
                  } else {
                    updateField({ capacity: 0 });
                  }
                }}
                className="rounded-md focus:ring-0"
                size="lg"
              />
            </div>
          </div>
          <div>
            <label className="text-black text-lg font-semibold">Is your event private?</label>
            <p className="text-sm mb-5 mt-2">
              Private Events will not be shown on the public dashboard and can be accessed by a link. It is not possible
              to change this after the event is created.
            </p>
            <div className="mt-4">
              <Select
                size="md"
                label="Select Visibility"
                value={isPrivate ? "Private" : "Public"}
                onChange={(e) => {
                  const privacyValue = e || "Public";
                  handlePrivacyChange(privacyValue);
                }}
              >
                <Option value="Public">Public</Option>
                <Option value="Private">Private</Option>
              </Select>
            </div>
          </div>
        </div>
        {user.stripeAccountActive ? (
          <div>
            <label className="text-black text-lg font-semibold">Is your event accepting payments?</label>
            <p className="text-sm mb-5 mt-2">
              If you are accepting payments, ensure your Stripe account is fully set up. Funds transfer will occur
              through Stripe.
            </p>
            <div className="mt-4">
              <Select
                size="md"
                label="Accepting Payments"
                value={paymentsActive.toString()}
                onChange={(e) => {
                  const paymentsActive = e || "false";
                  handlePaymentsActiveChange(paymentsActive);
                }}
              >
                <Option value="false">False</Option>
                <Option value="true">True</Option>
              </Select>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 p-3 border border-1 border-blue-gray-200 rounded-lg flex-col flex">
              <h2 className="text-lg mb-2">Register for Organiser Hub!</h2>
              <p className="font-light text-sm">Join hundreds of sport societies hosting their events on Sportshub.</p>
              <p className="font-light text-sm">
                Leverage the ability to take bookings and payments right through the platform.
              </p>
              <button
                className="ml-auto bg-black px-3 py-1.5 text-white rounded-lg mt-2"
                type="button"
                onClick={async () => {
                  setLoading(true);
                  window.scrollTo(0, 0);
                  const link = await getStripeStandardAccountLink(
                    user.userId,
                    getUrlWithCurrentHostname("/organiser/dashboard"),
                    getRefreshAccountLinkUrl()
                  );
                  router.push(link);
                }}
              >
                Register
              </button>
            </div>
          </>
        )}
        {!paymentsActive && (
          <div>
            <label className="text-black text-lg font-semibold">What’s the link to your event?</label>
            <p className="text-sm mb-5 mt-2">
              Paste your event&apos;s link here. Your link will redirect consumers to your event&apos;s page!
            </p>
            <Input
              label="Event Link"
              crossOrigin={undefined}
              value={eventLink}
              onChange={handleChange}
              className={`rounded-md focus:ring-0 ${error ? "border-red-500" : ""}`}
              size="lg"
            />

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}
        <div className="w-full space-y-4">
          <button
            type="button"
            className="text-black text-lg font-semibold flex hover:bg-gray-200 rounded-lg py-1 w-full"
            onClick={() => {
              setIsAdditionalSettingsOpen(!isAdditionalSettingsOpen);
            }}
          >
            <h2>Additional Settings</h2>
            {isAdditionalSettingsOpen ? (
              <ChevronUpIcon className="w-7 h-7 ml-auto" />
            ) : (
              <ChevronDownIcon className="w-7 h-7 ml-auto" />
            )}
          </button>
          {isAdditionalSettingsOpen && (
            <>
              <div>
                <RecurringEventsForm
                  startDate={startDate}
                  newRecurrenceData={newRecurrenceData}
                  setRecurrenceData={(data: NewRecurrenceFormData) => {
                    updateField({ newRecurrenceData: data });
                  }}
                />
              </div>
              {user.stripeAccountActive && paymentsActive && (
                <>
                  <div>
                    <label className="text-black text-lg font-semibold">
                      Do you want to pass Application Fees onto the Customer?
                    </label>
                    <p className="text-sm mb-5 mt-2">
                      Application Fees include Stripe card surcharges. Selecting yes will mean your customers will be
                      charged the fees ontop of the ticket price, shown as a Card Surcharge fee.
                    </p>
                    <div className="mt-4">
                      <Select
                        size="md"
                        label="Stripe Fee to Customer"
                        value={stripeFeeToCustomer ? "Yes" : "No"}
                        onChange={(e) => {
                          const value = e || "Yes";
                          handleStripeFeesToCustomerChange(value);
                        }}
                      >
                        <Option value="Yes">Yes</Option>
                        <Option value="No">No</Option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-black text-lg font-semibold">
                      Do you want to allow Promotional Codes for this Event?
                    </label>
                    <p className="text-sm mb-5 mt-2">
                      Selecting &quot;Yes&quot; will mean customers will be able to enter promotional codes for
                      discounts at the time of checkout. To create a promotional code for your account, please visit
                      your stripe dashboard.
                    </p>
                    <div className="mt-4">
                      <Select
                        size="md"
                        label="Promotional Codes Enabled"
                        value={promotionalCodesEnabled ? "Yes" : "No"}
                        onChange={(e) => {
                          const value = e || "Yes";
                          handlePromotionalCodesEnabledChange(value);
                        }}
                      >
                        <Option value="Yes">Yes</Option>
                        <Option value="No">No</Option>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              {WAITLIST_ENABLED && (
                <div>
                  <label className="text-black text-lg font-semibold">
                    Do you want to enable Waitlists for this Event?
                  </label>
                  <p className="text-sm mb-5 mt-2">
                    Selecting &quot;Yes&quot; will mean customers will be able to join a waitlist for this event
                    when the event is sold out. They will receive an email when a ticket becomes available.
                  </p>
                  <div className="mt-4">
                    <Select
                      size="md"
                      label="Waitlist Enabled"
                      value={waitlistEnabled ? "Yes" : "No"}
                      onChange={(e) => {
                        const value = e || "Yes";
                        handleWaitlistEnabledChange(value);
                      }}
                    >
                      <Option value="Yes">Yes</Option>
                      <Option value="No">No</Option>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FormWrapper>
  );
}
