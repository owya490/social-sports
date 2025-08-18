"use client";

type Card = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

const cards: Card[] = [
  {
    title: "Simple yet powerful",
    description: "Clean, intuitive user experience, yet a feature rich platform, ready to power your events.",
    imageSrc: "/images/organiser/31.png",
    imageAlt: "Feature visual",
  },
  {
    title: "Designed to move fast",
    description: "Lightning‑quick flows for publishing events and collecting payments.",
    imageSrc: "/images/organiser/30.png",
    imageAlt: "Speed visual",
  },
  {
    title: "Secure and private",
    description: "Privacy‑first design, secure payments and protected participant data.",
    imageSrc: "/images/organiser/29.png",
    imageAlt: "Security visual",
  },
];

export default function FeatureTilesGrid(): JSX.Element {
  return (
    <div className="hidden md:grid grid-cols-3 gap-6 mt-10">
      {cards.map((card, index) => (
        <article
          key={card.title}
          className="relative rounded-2xl overflow-hidden border border-core-outline bg-white shadow-sm"
        >
          {/* Make the card a perfect square */}
          <div className="pt-[100%]" />
          <div className="absolute inset-0 p-6 flex flex-col">
            <img
              src={card.imageSrc}
              alt={card.imageAlt}
              className="w-full h-1/2 object-contain rounded-xl border border-core-outline/50"
            />
            <h4 className="mt-4 text-lg font-semibold">{card.title}</h4>
            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{card.description}</p>
            {/* <div className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <span className="text-xl leading-none">+</span>
            </div> */}
          </div>
        </article>
      ))}
    </div>
  );
}
