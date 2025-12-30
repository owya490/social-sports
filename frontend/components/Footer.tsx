"use client";

import { LightBulbIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Routes where the footer should be hidden (as regex patterns)
const HIDDEN_FOOTER_ROUTES = [
  /^\/organiser\/wrapped/, // Organiser wrapped page
  /^\/user\/[^/]+\/wrapped/, // Public wrapped page (/user/*/wrapped)
];

const shouldHideFooter = (pathname: string): boolean => {
  return HIDDEN_FOOTER_ROUTES.some((pattern) => pattern.test(pathname));
};

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on specific routes
  if (shouldHideFooter(pathname)) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t-[1px] border-gray-400 bottom-0 h-[var(--footer-height)] flex justify-center items-center fixed z-50">
      <div className="screen-width-dashboard text-xs flex">
        <Link href="/aboutUs" className="mr-2">
          © 2025 SPORTSHUB
        </Link>
        <ol className="hidden sm:block">
          <Link href="/" className="mx-2">
            Dashboard
          </Link>
          <Link href="/organiser/dashboard" className="mx-2">
            Organiser Hub
          </Link>
          <Link href="/landing" className="mx-2">
            Landing
          </Link>
          <Link href="/event/create" className="mx-2">
            Create Event
          </Link>
          <Link href="/blogs" className="mx-2">
            Blogs
          </Link>
          <Link href="/docs" className="mx-2">
            Docs
          </Link>
        </ol>
        <Link href="/contact" className="ml-auto flex justify-center items-center mr-4">
          <LightBulbIcon className="h-4 mr-1" />
          <p className="font-bold">Contact Us</p>
        </Link>
        {/* <Link href="/contact" className="">
          <p className="font-bold">Contact Us</p>
        </Link> */}
      </div>
    </footer>
  );
}
