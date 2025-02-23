import { LightBulbIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-[1px] border-gray-400 bottom-0 h-8 flex justify-center items-center fixed">
      <div className="screen-width-dashboard text-xs flex">
        <p className="mr-2">© 2024 SPORTSHUB</p>
        <ol className="hidden sm:block">
          <Link href="/dashboard" className="mx-2">
            Dashboard
          </Link>
          <Link href="/organiser/dashboard" className="mx-2">
            Organiser Hub
          </Link>
          <Link href="/event/create" className="mx-2">
            Create Event
          </Link>
          <Link href="/faq" className="mx-2">
            FAQ
          </Link>
        </ol>
        <Link href="/suggestions" className="ml-auto flex justify-center items-center">
          <LightBulbIcon className="h-4 mr-1" />
          <p className="font-bold">Suggestions</p>
        </Link>
      </div>
    </footer>
  );
}
