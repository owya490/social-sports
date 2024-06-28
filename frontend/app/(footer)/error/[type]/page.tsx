"use client"; // Error components must be Client Components

export default function Error({ params }: any) {
  const type = params.type;
  switch (type) {
    case "CREATE_UPDATE_EVENT_RATELIMITED": {
      return (
        <div className="h-screen w-full flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl">Oh no, you've been Rate Limited for Create/ Update Event!</h2>
            <p className="font-light">Please wait 15 minutes and try again! </p>
          </div>
        </div>
      );
    }
    default: {
      return (
        <div className="h-screen w-full flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl">Oh no, something went wrong! Please navigate back to try again.</h2>
            <p className="font-light">
              If the error continues to persist, please use the suggestions page to contact us directly.{" "}
            </p>
          </div>
        </div>
      );
    }
  }
}
