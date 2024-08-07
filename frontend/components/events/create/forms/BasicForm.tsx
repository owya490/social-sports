// BasicInformation.tsx

import LocationAutocompleteForm from "@/components/utility/AutoComplete";
import { UserData } from "@/interfaces/UserTypes";
import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { Input, Option, Select } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateEventCostSlider from "../CreateEventCostSlider";
import CustomDateInput from "../CustomDateInput";
import CustomTimeInput from "../CustomTimeInput";
import { FormWrapper } from "./FormWrapper";

export type BasicData = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  sport: string;
  price: number;
  capacity: number;
  isPrivate: boolean;
  paymentsActive: boolean;
  lat: number;
  long: number;
};

type BasicInformationProps = BasicData & {
  user: UserData;
  updateField: (fields: Partial<BasicData>) => void;
  setLoading: (value: boolean) => void;
  setHasError: (value: boolean) => void;
};

export function BasicInformation({
  name,
  location,
  startDate,
  endDate,
  startTime,
  endTime,
  sport,
  price,
  capacity,
  isPrivate,
  paymentsActive,
  user,
  updateField,
  setLoading,
  setHasError,
}: BasicInformationProps) {
  const router = useRouter();
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null); // Initialize locationError state

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
  };

  const handleEndDateChange = (selectedDate: string) => {
    updateField({ endDate: selectedDate });
  };

  useEffect(() => {
    updateField({ endDate: startDate });
  }, [startDate]);

  const handleStartTimeChange = (selectedTime: string) => {
    updateField({ startTime: selectedTime });
  };

  const handleEndTimeChange = (selectedTime: string) => {
    updateField({ endTime: selectedTime });
  };

  useEffect(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = new Date(`${startDate}T${startTime}`);
    const selectedEndDateTime = new Date(`${endDate}T${endTime}`);
    console.log(startDate, startTime);

    if (currentDateTime > selectedStartDateTime) {
      setDateWarning("Event start date and time is in the past!");
    } else {
      setDateWarning(null);
    }

    if (selectedEndDateTime < selectedStartDateTime) {
      setTimeWarning("Event must end after it starts!");
    } else {
      setTimeWarning(null);
    }

    if (currentDateTime > selectedStartDateTime || selectedEndDateTime < selectedStartDateTime) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [startDate, startTime, endDate, endTime]);

  const [customAmount, setCustomAmount] = useState(price);

  const handleEventCostSliderChange = (amount: number) => {
    handleCustomAmountChange(amount);
    updateField({ price: amount });
  };

  const handleCustomAmountChange = (amount: number) => {
    amount = Number.isNaN(amount) ? 0 : amount;
    setCustomAmount(amount);
    updateField({ price: amount }); // Update the cost field in the parent component
  };

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
          />
        </div>
        <div>
          <label className="text-black text-lg font-semibold">When does your event start and end?</label>
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-2 mt-4">
            <div className="basis-1/3">
              <CustomDateInput date={startDate} placeholder="Start Date" handleChange={handleStartDateChange} />
            </div>
            <div className="basis-1/4">
              <CustomTimeInput value={startTime} placeholder="Start Time" handleChange={handleStartTimeChange} />
            </div>
            <div className="basis-1/3">
              <CustomDateInput date={endDate} placeholder="End Date" handleChange={handleEndDateChange} />
            </div>
            <div className="basis-1/4">
              <CustomTimeInput value={endTime} placeholder="End Time" handleChange={handleEndTimeChange} />
            </div>
          </div>
          {dateWarning && <div className="text-red-600 text-sm mt-2">{dateWarning}</div>}
          {timeWarning && <div className="text-red-600 text-sm mt-2">{timeWarning}</div>}
        </div>

        <div>
          <label className="text-black text-lg font-semibold">Where is it located?</label>
          <div className="mt-4">
            <LocationAutocompleteForm location={location} updateField={updateField} />
            {locationError && <p className="text-red-500">{locationError}</p>}
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">What Sport is it?</label>
          <div className="mt-4">
            <Select
              label="Select Sport"
              size="lg"
              value={sport}
              onChange={(e) => {
                updateField({ sport: e });
              }}
            >
              <Option value="volleyball">Volleyball</Option>
              <Option value="badminton">Badminton</Option>
              <Option value="basketball">Basketball</Option>
              <Option value="soccer">Soccer</Option>
              <Option value="tennis">Tennis</Option>
              <Option value="table-tennis">Table Tennis</Option>
              <Option value="oztag">Oztag</Option>
              <Option value="baseball">Baseball</Option>
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
              onCustomAmountChange={handleEventCostSliderChange}
            />
          </div>
          <div className="w-full flex flex-col mt-8 md:flex-row md:space-x-3 my-6">
            <div className="w-full sm:w-1/2 mt-4 sm:mt-0">
              <Input
                label="Price"
                crossOrigin={undefined}
                required
                value={price}
                type="number"
                onChange={(e) => {
                  let value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    value = Math.max(value, 0);
                  } else {
                    value = 0;
                  }
                  handleCustomAmountChange(value);
                }}
                className="rounded-md focus:ring-0"
                size="lg"
                icon={<CurrencyDollarIcon />}
              />
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
            <label className="text-black text-lg font-semibold">Is your event Private?</label>
            <p className="text-sm mb-5 mt-2">
              Private Events will not be shown on the public dashboard and will be invite only
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
              If you are accepting payments, ensure your Stripe account is fully setup. Funds transfer will occur
              through Stripe.
            </p>
            <div className="mt-4 w-1/2">
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
          <div className="mt-5 p-3 border border-1 border-blue-gray-200 rounded-lg flex-col flex">
            <h2 className=" text-lg mb-2">Register for Organiser Hub!</h2>
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
                  getUrlWithCurrentHostname("/organiser"),
                  getRefreshAccountLinkUrl()
                );
                router.push(link);
              }}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </FormWrapper>
  );
}
