"use client"; // Error components must be Client Components

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

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
