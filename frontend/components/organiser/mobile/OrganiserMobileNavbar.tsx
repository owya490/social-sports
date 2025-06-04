import { CalendarIcon, ChartBarIcon, HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OrganiserMobileNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      icon: HomeIcon,
      href: "/organiser/dashboard",
      isActive: pathname.startsWith("/organiser/dashboard"),
    },
    {
      icon: CalendarIcon,
      href: "/organiser/event/dashboard",
      isActive: pathname.startsWith("/organiser/event"),
    },
    {
      icon: ChartBarIcon,
      href: "/organiser/metrics",
      isActive: pathname.startsWith("/organiser/metrics"),
    },
    // disabled for now
    // {
    //   icon: CameraIcon,
    //   label: "Gallery",
    //   href: "/organiser/gallery",
    //   isActive: pathname.startsWith("/organiser/gallery"),
    // },
    {
      icon: UserIcon,
      href: "/organiser/settings",
      isActive: pathname.startsWith("/organiser/settings"),
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-12 mb-8 h-[3.75rem]">
        <div className="bg-organiser-dark-gray-text/80 backdrop-blur-sm rounded-full h-full">
          <div className="px-2 flex justify-between items-center h-full">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center p-3 rounded-full transition-all duration-200 ${
                  item.isActive ? "bg-organiser-light-gray" : ""
                }`}
              >
                <item.icon
                  className={`w-6 h-6 transition-colors ${
                    item.isActive ? "text-organiser-dark-gray-text stroke-[1.1]" : "text-organiser-light-gray stroke-1"
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
