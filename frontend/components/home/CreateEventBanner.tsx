export default function CreateEventBanner() {
  return (
    <div className="w-screen flex justify-center my-44">
      <div className="screen-width-dashboard flex justify-center flex-wrap">
        <h1 className="text-5xl font-extrabold text-center lg:text-7xl 2xl:text-8xl basis-full">
          Create an Event Now!
        </h1>
        <div className="basis-full flex justify-center">
          <p className="w-1/2 text-center text-lg font-thin mt-7">
            Supercharge your event with the power of Sports Hub! Find players,
            handle bookings and gain outreach all within one complete platform.
            Try it all for free today!
          </p>
        </div>
        <button className="border border-1 border-black py-2.5 px-5 mt-7 rounded-lg hover:bg-black hover:text-white transition-all duration-500">
          <p className="uppercase text-lg font-semibold">Create Event Now</p>
        </button>
      </div>
    </div>
  );
}
