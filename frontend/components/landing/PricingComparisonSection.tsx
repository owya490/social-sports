"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const platforms = [
  {
    name: "SPORTSHUB",
    logo: null,
    logoClassName: "",
    percentage: 1.0,
    fixedFee: 0,
    feeLabel: "1%",
    highlight: true,
  },
  {
    name: "Eventbrite",
    logo: "/images/company-logos/eventbrite.png",
    logoClassName: "h-7 w-auto max-w-[140px] object-contain",
    percentage: 5.35,
    fixedFee: 1.19,
    feeLabel: "5.35% + $1.19",
    highlight: false,
  },
  {
    name: "Revolutionise Sport",
    logo: "/images/company-logos/revolutionise-sport.png",
    logoClassName: "h-7 w-auto max-w-[140px] object-contain",
    percentage: 2.0,
    fixedFee: 1.6,
    feeLabel: "2% + $1.60",
    highlight: false,
  },
  {
    name: "Meetup",
    logo: "/images/company-logos/meetup.png",
    logoClassName: "h-10 w-auto max-w-[160px] object-contain",
    percentage: 3.7,
    fixedFee: 1.25,
    feeLabel: "3.7% + $1.25",
    highlight: false,
  },
];

function calcFee(percentage: number, fixedFee: number, ticketPrice: number) {
  return ticketPrice * (percentage / 100) + fixedFee;
}

function calcYearlyFees(percentage: number, fixedFee: number, ticketPrice: number, ticketsPerYear: number) {
  return ticketsPerYear * calcFee(percentage, fixedFee, ticketPrice);
}

const examplePrices = [10, 100];

const EVENTS_PER_WEEK = 2;
const ATTENDEES_PER_EVENT = 30;
const WEEKS_PER_YEAR = 52;
const YEARLY_TICKET_PRICE = 10;
const TICKETS_PER_YEAR = EVENTS_PER_WEEK * ATTENDEES_PER_EVENT * WEEKS_PER_YEAR;

function SportshubLogo() {
  return (
    <div className="flex items-center gap-2.5 justify-center">
      <img src="/images/company-logos/sportshub-white.png" alt="SPORTSHUB" className="h-8 w-8 object-contain" />
      <span className="text-base font-bold tracking-wider text-white">SPORTSHUB</span>
    </div>
  );
}

function CardCarousel({ sportshub, sportshubYearly }: { sportshub: (typeof platforms)[0]; sportshubYearly: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const getCards = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return [];
    return Array.from(el.querySelectorAll("[data-card]")) as HTMLElement[];
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll("[data-card]")) as HTMLElement[];
    if (cards.length === 0) return;

    const containerRect = el.getBoundingClientRect();
    const snapOffset = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
    const targetX = containerRect.left + snapOffset;

    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.getBoundingClientRect().left - targetX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    const cards = getCards();
    const el = scrollRef.current;
    if (!cards[index] || !el) return;
    const snapOffset = parseFloat(getComputedStyle(el).scrollPaddingInlineStart) || 0;
    el.scrollTo({
      left: cards[index].offsetLeft - snapOffset,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 pl-6 pr-6"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollPaddingInlineStart: "24px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>

        {/* Sportshub card */}
        <div data-card className="snap-start shrink-0 w-[85%] sm:w-[70%] md:w-[55%] lg:w-[45%]">
          <div className="bg-black text-white rounded-2xl p-6 border-2 border-black h-full">
            <div className="flex items-center justify-between mb-4">
              <SportshubLogo />
              <span className="text-xs bg-white text-black px-3 py-1 rounded-full font-semibold">CHEAPEST</span>
            </div>
            <p className="text-2xl font-bold mb-1">{sportshub.feeLabel}</p>
            <p className="text-gray-400 text-xs mb-4">platform fee per ticket</p>
            <div className="space-y-2 border-t border-gray-700 pt-4">
              {examplePrices.map((price) => (
                <div key={price} className="flex justify-between text-sm">
                  <span className="text-gray-400">${price} ticket</span>
                  <span className="font-semibold text-green-400">
                    ${calcFee(sportshub.percentage, sportshub.fixedFee, price).toFixed(2)} fee
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 mt-4 pt-4">
              <p className="text-xs text-gray-400 mb-1">
                Yearly fees &middot; {EVENTS_PER_WEEK} events/wk &times; {ATTENDEES_PER_EVENT} people &times; $
                {YEARLY_TICKET_PRICE}
              </p>
              <p className="text-xl font-bold text-green-400">
                $
                {sportshubYearly.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                <span className="text-xs text-gray-400 font-normal ml-1">/ year</span>
              </p>
            </div>
          </div>
        </div>

        {/* Competitor cards */}
        {platforms
          .filter((p) => !p.highlight)
          .map((p) => {
            const yearly = calcYearlyFees(p.percentage, p.fixedFee, YEARLY_TICKET_PRICE, TICKETS_PER_YEAR);
            const yearlySaved = yearly - sportshubYearly;
            return (
              <div key={p.name} data-card className="snap-start shrink-0 w-[85%] sm:w-[70%] md:w-[55%] lg:w-[45%]">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
                  <div className="flex items-center mb-4">
                    <img
                      src={p.logo!}
                      alt={p.name}
                      className={
                        p.name === "Meetup"
                          ? "h-6 w-auto max-w-[140px] object-contain"
                          : "h-6 w-auto max-w-[140px] object-contain"
                      }
                    />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-1">{p.feeLabel}</p>
                  <p className="text-gray-400 text-xs mb-4">per ticket</p>
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    {examplePrices.map((price) => {
                      const fee = calcFee(p.percentage, p.fixedFee, price);
                      const sportshubFee = calcFee(sportshub.percentage, sportshub.fixedFee, price);
                      const extra = fee - sportshubFee;
                      return (
                        <div key={price} className="flex justify-between text-sm">
                          <span className="text-gray-400">${price} ticket</span>
                          <span className="text-gray-700">
                            ${fee.toFixed(2)} <span className="text-gray-400 text-xs">(+${extra.toFixed(2)})</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <p className="text-xs text-gray-400 mb-1">
                      Yearly fees &middot; {EVENTS_PER_WEEK} events/wk &times; {ATTENDEES_PER_EVENT} people &times; $
                      {YEARLY_TICKET_PRICE}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      $
                      {yearly.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      <span className="text-xs text-gray-400 font-semibold ml-2">
                        +$
                        {yearlySaved.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        more
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        {/* Right padding spacer — ensures last card has breathing room */}
        <div className="shrink-0 w-px" aria-hidden="true" />
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {platforms.map((p, i) => (
          <button
            key={p.name}
            onClick={() => scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === activeIndex ? "bg-black" : "bg-gray-300"}`}
            aria-label={`Go to ${p.name}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function PricingComparisonSection() {
  const sportshub = platforms[0];

  const sportshubYearly = calcYearlyFees(
    sportshub.percentage,
    sportshub.fixedFee,
    YEARLY_TICKET_PRICE,
    TICKETS_PER_YEAR
  );

  return (
    <div className="w-screen flex justify-center py-24 bg-white">
      <div className="screen-width-dashboard px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 text-xs font-medium mb-6 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            PRICING
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-black mb-4 leading-tight">
            The lowest fees in the market
          </h3>
          <p className="text-gray-500 font-light max-w-xl mx-auto text-lg">
            More of your revenue stays where it belongs — in your pocket.
          </p>
        </div>

        {/* Desktop table (xl and above) */}
        <div className="hidden xl:block">
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-5 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider w-[200px]" />
                  {platforms.map((p) => (
                    <th key={p.name} className={`py-5 px-6 ${p.highlight ? "bg-black" : ""}`}>
                      {p.highlight ? (
                        <SportshubLogo />
                      ) : (
                        <div className="flex justify-center">
                          <img src={p.logo!} alt={p.name} className={p.logoClassName} />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Fee structure row */}
                <tr className="border-b border-gray-100">
                  <td className="py-5 px-6 text-sm font-medium text-gray-500">Platform fee</td>
                  {platforms.map((p) => (
                    <td
                      key={p.name}
                      className={`py-5 px-6 text-center text-sm font-semibold ${
                        p.highlight ? "bg-black text-white" : "text-gray-700"
                      }`}
                    >
                      {p.feeLabel}
                    </td>
                  ))}
                </tr>

                {/* Example price rows */}
                {examplePrices.map((price) => {
                  const sportshubFee = calcFee(sportshub.percentage, sportshub.fixedFee, price);
                  return (
                    <tr key={price} className="border-b border-gray-100">
                      <td className="py-5 px-6 text-sm font-medium text-gray-500">Fee on ${price} ticket</td>
                      {platforms.map((p) => {
                        const fee = calcFee(p.percentage, p.fixedFee, price);
                        const savings = fee - sportshubFee;
                        return (
                          <td key={p.name} className={`py-5 px-6 text-center ${p.highlight ? "bg-black" : ""}`}>
                            <span className={`text-sm font-semibold ${p.highlight ? "text-white" : "text-gray-700"}`}>
                              ${fee.toFixed(2)}
                            </span>
                            {!p.highlight && savings > 0 && (
                              <span className="block text-xs text-gray-400 mt-0.5">+${savings.toFixed(2)} more</span>
                            )}
                            {p.highlight && (
                              <span className="block text-xs text-green-400 mt-0.5 font-medium">Lowest</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Yearly savings row */}
                <tr className="border-t-2 border-gray-200">
                  <td className="py-6 px-6">
                    <span className="text-sm font-semibold text-black block">Yearly fees</span>
                    <span className="text-xs text-gray-400 block mt-0.5">
                      {EVENTS_PER_WEEK} events/wk &times; {ATTENDEES_PER_EVENT} people &times; ${YEARLY_TICKET_PRICE}{" "}
                      ticket
                    </span>
                  </td>
                  {platforms.map((p) => {
                    const yearly = calcYearlyFees(p.percentage, p.fixedFee, YEARLY_TICKET_PRICE, TICKETS_PER_YEAR);
                    const extra = yearly - sportshubYearly;
                    return (
                      <td key={p.name} className={`py-6 px-6 text-center ${p.highlight ? "bg-black" : ""}`}>
                        <span className={`text-lg font-bold ${p.highlight ? "text-white" : "text-gray-800"}`}>
                          $
                          {yearly.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        {p.highlight && (
                          <span className="block text-xs text-green-400 mt-1 font-semibold">Best value</span>
                        )}
                        {!p.highlight && extra > 0 && (
                          <span className="block text-xs text-gray-400 mt-1 font-semibold">
                            $
                            {extra.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}{" "}
                            more per year
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card carousel (lg and below) */}
        <div className="xl:hidden">
          <CardCarousel sportshub={sportshub} sportshubYearly={sportshubYearly} />
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Stripe processing fees may apply. Yearly estimate based on {EVENTS_PER_WEEK} events per week with{" "}
          {ATTENDEES_PER_EVENT} attendees at ${YEARLY_TICKET_PRICE} each over {WEEKS_PER_YEAR} weeks.
        </p>
      </div>
    </div>
  );
}
