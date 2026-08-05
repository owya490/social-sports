"use client";

import { usesOrganiserV2Chrome } from "@/components/navbar/navbarVisibility";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { usePathname } from "next/navigation";

export default function OrganiserChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (usesOrganiserV2Chrome(pathname)) {
    return (
      <div className="min-h-screen bg-background">
        <OrganiserSidebar />
        <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
          <div className="pt-16 lg:pt-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <OrganiserNavbar />
      <div className="pb-28 sm:ml-14 sm:pb-0">{children}</div>
    </>
  );
}
