"use client";
import { HighlightButton } from "@/components/elements/HighlightButton";
import { HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="screen-width-dashboard text-center px-4">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-core-text opacity-20">404</h1>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto mb-12">
          <h2 className="text-3xl font-bold text-core-text mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8 font-light">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or you entered
            the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <HighlightButton text="Go to Dashboard" className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
            </HighlightButton>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-sm text-gray-500">
          <p className="mb-2">Need help? Check out our:</p>
          <div className="flex flex-wrap justify-center gap-4 text-core-text">
            <Link href="/aboutUs" className="hover:underline font-medium">
              About Us
            </Link>
            <Link href="/contact" className="hover:underline font-medium">
              Contact
            </Link>
            <Link href="/blogs" className="hover:underline font-medium">
              Blogs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
