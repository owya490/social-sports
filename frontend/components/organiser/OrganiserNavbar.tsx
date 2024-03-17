"use client";

import Image from "next/image";
import OrganiserDashboardIcon from "../../public/images/organiser-dashboard-icon.svg";
import EventDashboardIcon from "../../public/images/event-dashboard-icon.svg";
import EventDrilldownIcon from "../../public/images/event-drilldown-icon.svg";
import OrganiserMetricsIcon from "../../public/images/organiser-metrics-icon.svg";
import OrganiserGalleryIcon from "../../public/images/organiser-gallery-icon.svg";
import OrganiserSettingsIcon from "../../public/images/organiser-settings-icon.svg";
import Link from "next/link";

export default function OrganiserNavbar() {
  return (
    <div className="bg-organiser-light-gray drop-shadow-lg fixed left-0 h-screen z-40 pt-16">
      <div className="w-14 flex flex-col mt-6">
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={OrganiserDashboardIcon} alt="Logo" width={0} height={0} className="w-10 my-4" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={EventDashboardIcon} alt="Logo" width={0} height={0} className="w-12 my-4" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={EventDrilldownIcon} alt="Logo" width={0} height={0} className="w-10 my-4" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={OrganiserMetricsIcon} alt="Logo" width={0} height={0} className="w-8 my-4" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={OrganiserGalleryIcon} alt="Logo" width={0} height={0} className="w-8 my-4" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <Image priority={true} src={OrganiserSettingsIcon} alt="Logo" width={0} height={0} className="w-10 my-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
