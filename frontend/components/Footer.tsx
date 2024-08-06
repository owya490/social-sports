import { PencilSquareIcon } from "@heroicons/react/24/outline";
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
        </ol>
        <Link href="/event/create" className="ml-auto flex justify-center items-center">
          <PencilSquareIcon className="h-4 mr-1" />
          <p className="font-bold">Create Event</p>
        </Link>
      </div>
    </footer>
  );
}
