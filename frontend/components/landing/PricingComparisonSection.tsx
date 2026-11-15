"use client";

import { useState } from "react";
import { SPORTSHUB_FEE_PERCENTAGE, SPORTSHUB_FIXED_FEE_CENTS, sportshubFeeCents } from "./landingFees";
import scroll from "./landingScroll.module.css";

const platforms = [
  {
    name: "SPORTSHUB",
    logo: null,
    logoClassName: "",
    percentage: SPORTSHUB_FEE_PERCENTAGE,
    fixedFee: SPORTSHUB_FIXED_FEE_CENTS / 100,
    feeLabel: "2.65% + 30¢",
    yearlySubscription: 0,
    highlight: true,
  },
  {
    name: "Eventbrite",
    logo: "/images/company-logos/eventbrite.png",
    logoClassName: "h-7 w-auto max-w-[140px] object-contain",
    percentage: 5.35,
    fixedFee: 1.19,
    feeLabel: "5.35% + $1.19",
    yearlySubscription: 1200,
    highlight: false,
  },
  {
    name: "Revolutionise Sport",
    logo: "/images/company-logos/revolutionise-sport.png",
    logoClassName: "h-7 w-auto max-w-[140px] object-contain",
    percentage: 2.0,
    fixedFee: 1.6,
    feeLabel: "2% + $1.60",
    yearlySubscription: 989,
    highlight: false,
  },
  {
    name: "Meetup",
    logo: "/images/company-logos/meetup.png",
    logoClassName: "h-10 w-auto max-w-[160px] object-contain",
    percentage: 3.7,
    fixedFee: 1.25,
    feeLabel: "3.7% + $1.25",
    yearlySubscription: 660,
    highlight: false,
  },
];

function calcFee(percentage: number, fixedFee: number, ticketPrice: number) {
  // SPORTSHUB checkout rounds its fee up to the cent per booking, so mirror that rather than the raw rate.
  if (percentage === SPORTSHUB_FEE_PERCENTAGE && fixedFee * 100 === SPORTSHUB_FIXED_FEE_CENTS) {
    return sportshubFeeCents(Math.round(ticketPrice * 100)) / 100;
  }
  return ticketPrice * (percentage / 100) + fixedFee;
}

// Rates such as 2.65% of $10 land just under a half-cent in binary and would display one cent low.
function formatDollars(amount: number): string {
  return (Math.round(amount * 100 + 1e-8) / 100).toFixed(2);
}

function calcYearlyFees(percentage: number, fixedFee: number, ticketPrice: number, ticketsPerYear: number) {
  return ticketsPerYear * calcFee(percentage, fixedFee, ticketPrice);
}


const ATTENDEES_PER_EVENT = 30;
const WEEKS_PER_YEAR = 52;

function SportshubLogo() {
  return (
    <div className="flex items-center gap-2.5 justify-center">
      <img src="/images/company-logos/sportshub-white.png" alt="SPORTSHUB" className="h-8 w-8 object-contain" />
      <span className="text-base font-bold tracking-wider text-white">SPORTSHUB</span>
    </div>
  );
}

const PRICE_OPTIONS = [10, 15, 20];
const SESSION_OPTIONS = [1, 2, 3];

function formatWhole(amount: number): string {
  return Math.round(amount).toLocaleString("en-AU");
}

function Segmented({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-gray-100 p-0.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`min-w-[3rem] rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              value === option ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

type PricingRow = {
  platform: (typeof platforms)[number];
  yearly: number;
  perTicket: number;
};

/** Phone and tablet view: one row per platform with a yearly-cost bar, driven by the shared toggles. */
function CostRace({ rows, ticketPrice }: { rows: PricingRow[]; ticketPrice: number }) {
  const maxYearly = Math.max(...rows.map((row) => row.yearly));
  return (
    <ul className="space-y-5">
      {rows.map(({ platform, yearly, perTicket }) => (
        <li key={platform.name}>
          <div className="flex items-center justify-between gap-3">
            {platform.highlight ? (
              <span className="text-sm font-bold tracking-wider text-black">SPORTSHUB</span>
            ) : (
              <img src={platform.logo!} alt={platform.name} className="h-5 w-auto max-w-[120px] object-contain object-left" />
            )}
            <span className={`text-base tabular-nums ${platform.highlight ? "font-bold text-black" : "font-semibold text-gray-700"}`}>
              ${formatWhole(yearly)}
              <span className="text-xs font-medium text-gray-400">/yr</span>
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${platform.highlight ? "bg-black" : "bg-gray-400"}`}
              style={{ width: `${Math.max(3, (yearly / maxYearly) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {platform.feeLabel} · ${formatDollars(perTicket)} on a ${ticketPrice} ticket ·{" "}
            {platform.yearlySubscription === 0
              ? "no subscription, players can cover fees"
              : `$${platform.yearlySubscription.toLocaleString("en-AU")}/yr subscription`}
          </p>
        </li>
      ))}
    </ul>
  );
}

const SUBSCRIPTION_NOTES: Record<string, string> = {
  Eventbrite: "Pro plan",
  "Revolutionise Sport": "Large club plan",
  Meetup: "Meetup Pro subscription",
};

/** Desktop view: the same numbers as the cost race, laid out side by side. */
function ComparisonTable({ rows, ticketPrice }: { rows: PricingRow[]; ticketPrice: number }) {
  const sportshub = rows[0];
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="w-[200px] px-6 py-5" />
            {rows.map(({ platform }) => (
              <th key={platform.name} className={`px-6 py-5 ${platform.highlight ? "bg-black" : ""}`}>
                {platform.highlight ? (
                  <SportshubLogo />
                ) : (
                  <div className="flex justify-center">
                    <img src={platform.logo!} alt={platform.name} className={platform.logoClassName} />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-6 py-5 text-sm font-medium text-gray-500">Platform fee</td>
            {rows.map(({ platform }) => (
              <td
                key={platform.name}
                className={`px-6 py-5 text-center text-sm font-semibold ${platform.highlight ? "bg-black text-white" : "text-gray-700"}`}
              >
                {platform.feeLabel}
                {platform.highlight && <span className="mt-0.5 block text-xs font-medium text-green-400">Players can cover it</span>}
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-6 py-5 text-sm font-medium text-gray-500">Fee on a ${ticketPrice} ticket</td>
            {rows.map(({ platform, perTicket }) => (
              <td key={platform.name} className={`px-6 py-5 text-center ${platform.highlight ? "bg-black" : ""}`}>
                <span className={`text-sm font-semibold tabular-nums ${platform.highlight ? "text-white" : "text-gray-700"}`}>
                  ${formatDollars(perTicket)}
                </span>
                {platform.highlight ? (
                  <span className="mt-0.5 block text-xs font-medium text-green-400">Lowest</span>
                ) : (
                  <span className="mt-0.5 block text-xs text-gray-400">
                    +${formatDollars(perTicket - sportshub.perTicket)} more
                  </span>
                )}
              </td>
            ))}
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-6 py-5 text-sm font-medium text-gray-500">Yearly subscription</td>
            {rows.map(({ platform }) => (
              <td key={platform.name} className={`px-6 py-5 text-center ${platform.highlight ? "bg-black" : ""}`}>
                <span className={`text-sm font-semibold ${platform.highlight ? "text-white" : "text-gray-700"}`}>
                  {platform.yearlySubscription === 0 ? "Free" : `$${platform.yearlySubscription.toLocaleString("en-AU")}/yr`}
                </span>
                <span className={`mt-0.5 block text-xs ${platform.highlight ? "font-medium text-green-400" : "text-gray-400"}`}>
                  {platform.highlight ? "No subscription" : SUBSCRIPTION_NOTES[platform.name]}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t-2 border-gray-200">
            <td className="px-6 py-6 text-sm font-semibold text-black">Total per year</td>
            {rows.map(({ platform, yearly }) => (
              <td key={platform.name} className={`px-6 py-6 text-center ${platform.highlight ? "bg-black" : ""}`}>
                <span className={`text-lg font-bold tabular-nums ${platform.highlight ? "text-green-400" : "text-gray-800"}`}>
                  ${formatWhole(yearly)}/yr
                </span>
                {!platform.highlight && (
                  <span className="mt-1 block text-xs font-semibold text-gray-400">
                    {Math.round((yearly / sportshub.yearly - 1) * 100)}% more expensive
                  </span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function PricingComparisonSection() {
  const [ticketPrice, setTicketPrice] = useState(PRICE_OPTIONS[0]);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(SESSION_OPTIONS[1]);
  const ticketsPerYear = sessionsPerWeek * ATTENDEES_PER_EVENT * WEEKS_PER_YEAR;
  const rows: PricingRow[] = platforms.map((platform) => ({
    platform,
    yearly:
      platform.yearlySubscription + calcYearlyFees(platform.percentage, platform.fixedFee, ticketPrice, ticketsPerYear),
    perTicket: calcFee(platform.percentage, platform.fixedFee, ticketPrice),
  }));
  const nextCheapest = Math.min(...rows.slice(1).map((row) => row.yearly));

  return (
    <section aria-labelledby="pricing-title" className="flex w-full justify-center bg-white py-24">
      <div className="screen-width-dashboard px-6">
        <div className={`mb-12 text-center ${scroll.rise}`}>
          <h2 id="pricing-title" className="mb-4 text-4xl font-bold leading-tight text-black md:text-5xl">
            The lowest fees in the market
          </h2>
          <p className="mx-auto max-w-xl text-lg font-light text-gray-500">
            More of your revenue stays where it belongs, in your pocket.
          </p>
        </div>

        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-5 sm:p-8 xl:max-w-none xl:border-0 xl:p-0">
          <div className="xl:flex xl:items-end xl:justify-between xl:gap-10">
            <div className="space-y-3 xl:order-2 xl:w-[360px]">
              <Segmented
                label="Ticket price"
                options={PRICE_OPTIONS}
                value={ticketPrice}
                onChange={setTicketPrice}
                format={(value) => `$${value}`}
              />
              <Segmented
                label="Sessions a week"
                options={SESSION_OPTIONS}
                value={sessionsPerWeek}
                onChange={setSessionsPerWeek}
                format={(value) => `${value}`}
              />
            </div>
            <div className="mt-7 border-t border-gray-100 pt-6 xl:order-1 xl:mt-0 xl:border-0 xl:pt-0" aria-live="polite">
              <p className="text-sm text-gray-500">With {ATTENDEES_PER_EVENT} players a session, SPORTSHUB saves you</p>
              <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-black">
                ${formatWhole(nextCheapest - rows[0].yearly)}
                <span className="ml-1.5 text-lg font-medium tracking-normal text-gray-500">a year</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">versus the next cheapest option, even if your club covers every fee.</p>
            </div>
          </div>

          <div className="mt-7 xl:mt-10">
            <div className="hidden xl:block">
              <ComparisonTable rows={rows} ticketPrice={ticketPrice} />
            </div>
            <div className="xl:hidden">
              <CostRace rows={rows} ticketPrice={ticketPrice} />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          SPORTSHUB&apos;s fee includes Stripe card processing and can be passed on to players. Other platforms&apos;
          pricing as of October 2026; their card processing fees may apply.
        </p>
      </div>
    </section>
  );
}
