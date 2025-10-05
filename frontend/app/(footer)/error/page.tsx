"use client"; // Error components must be Client Components

import { HighlightButton } from "@/components/elements/HighlightButton";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function Error() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams?.get("message");
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-2xl px-6">
        <div className="flex justify-center mb-4">
          <Image
            src="https://static01.nyt.com/images/2016/08/05/us/05onfire1_xp/05onfire1_xp-superJumbo-v2.jpg"
            alt="Error"
            width={0}
            height={0}
            className="w-full max-w-xs h-full object-cover rounded-lg"
          />
        </div>
        <h2 className="text-3xl font-bold text-core-text mb-4">{"Oh no, something went wrong!"}</h2>
        {errorMessage && <h3 className="text-xs text-core-text font-light mb-4">{errorMessage}</h3>}
        <p className="text-lg font-light text-gray-600 mb-8">
          Please try again. If the error continues to persist, please use the contact us page to contact us directly.
        </p>

        {/* Back Button */}
        <div className="mb-12 flex justify-center">
          <HighlightButton text="Go Back" className="flex items-center gap-2" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-5 w-5" />
          </HighlightButton>
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
