interface NoEventsCardProps {
  sport: string;
}

export function NoEventsCard({ sport }: NoEventsCardProps) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center p-8 text-center rounded-lg bg-white">
      <p className="text-5xl" role="img" aria-label="Sad Face">
        😔
      </p>
      <h3 className="mt-4 text-2xl font-semibold text-gray-800">No {sport} events found...</h3>
      <p className="mt-2 text-gray-600">
        Looks like there aren't any upcoming {sport} events in Sydney right now. Check back soon or consider hosting
        your own!
      </p>
      <a
        href="/event/create"
        className="mt-6 inline-flex items-center rounded-full bg-yellow-500 px-6 py-3 font-semibold text-gray-900 transition hover:bg-yellow-400"
      >
        Host a {sport} session
      </a>
    </div>
  );
}
