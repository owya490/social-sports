import RecommendedEvents from "@components/events/RecommendedEvents";

export default function Home() {
    return (
        <main className="mx-36 mt-20">
            <div className="w-full bg-gray-300 h-[1px]"></div>
            <div className="flex my-5">
                <h5 className="font-bold text-lg">Similar events nearby</h5>
                <a className="text-sm font-light ml-auto cursor-pointer">
                    See all
                </a>
            </div>
            <div className="flex space-x-5">
                <RecommendedEvents />
                <RecommendedEvents />
                <RecommendedEvents />
                <RecommendedEvents />
            </div>
        </main>
    );
}
