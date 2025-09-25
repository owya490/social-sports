import { LightBulbIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-[1px] border-gray-400 bottom-0 h-8 flex justify-center items-center fixed z-50">
      <div className="screen-width-dashboard text-xs flex">
        <Link href="/aboutUs" className="mr-2">
          © 2025 SPORTSHUB
        </Link>
        <ol className="hidden sm:block">
          <Link href="/dashboard" className="mx-2">
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
