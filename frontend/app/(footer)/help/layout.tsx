import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { TfiHelpAlt } from "react-icons/tfi";

interface HelpLayoutProps {
  children: ReactNode;
}
export default function HelpLayout({ children }: HelpLayoutProps) {
  return (
    <div className="relative min-h-screen ">
      <Link href="/help">
        <div className="mt-20 ml-12 space-x-2 hidden sm:flex">
          <TfiHelpAlt size={28} />
          <span className="font-bold text-xl">Help Center</span>
        </div>
      </Link>
      <div className="pt-20 px-4">{children}</div>
    </div>
  );
}
