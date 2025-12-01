export function LoadingFeaturedEventCard() {
  return (
    <div className="animate-pulse rounded-lg overflow-hidden flex flex-col min-h-[300px] bg-white">
      <div className="h-48 w-full bg-gray-300 flex-shrink-0" style={{ borderRadius: "0.5rem 0.5rem 0 0" }}></div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center mb-1">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4 ml-auto"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3 mt-auto"></div>
      </div>
    </div>
  );
}
