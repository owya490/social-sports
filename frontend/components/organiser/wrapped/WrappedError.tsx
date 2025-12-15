"use client";

import Link from "next/link";

interface WrappedErrorProps {
  message: string;
  linkHref?: string;
  linkText?: string;
  className?: string;
}

/**
 * Error state component for wrapped pages.
 */
export function WrappedError({
  message,
  linkHref = "/",
  linkText = "Go to Homepage",
  className = "",
}: WrappedErrorProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center px-6 ${className}`}
    >
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😢</div>
        <h1 className="text-white text-2xl font-bold mb-4">Oops!</h1>
        <p className="text-gray-400 text-lg mb-8">{message}</p>
        <Link
          href={linkHref}
          className="inline-block px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
}
