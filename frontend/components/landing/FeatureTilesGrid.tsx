import { cards } from "./FeatureTilesCarousel";

export default function FeatureTilesGrid(): JSX.Element {
  return (
    <div className="hidden md:grid grid-cols-3 gap-6 mt-10">
      {cards.map((card) => (
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
          </div>
        </article>
      ))}
    </div>
  );
}
