export function LoadingNoEventsCard() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center p-8 text-center animate-pulse rounded-lg bg-white">
      <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
      <div className="mt-4 h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="mt-2 h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="mt-6 h-12 bg-gray-300 rounded-full w-48"></div>
    </div>
  );
}
