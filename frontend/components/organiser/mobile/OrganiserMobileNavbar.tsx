import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { ArrowPathIcon, CalendarIcon, HomeIcon, LinkIcon, StarIcon, UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
import { createContext, Fragment, useContext, useEffect, useState } from "react";

type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
  } & RefAttributes<SVGSVGElement>
>;

interface NavItem {
  icon: HeroIcon;
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

interface DropdownNavItem {
  icon: HeroIcon;
  label: string;
  isActive: (pathname: string) => boolean;
  subItems: NavItem[];
}

interface NavButtonProps {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}

interface DropdownNavButtonProps {
  item: DropdownNavItem;
  pathname: string;
  onNavigate: () => void;
}

interface DropdownContextType {
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  closeAllDropdowns: () => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a DropdownProvider");
  }
  return context;
};

const NavButton = ({ item, pathname, onNavigate }: NavButtonProps) => {
  const isActive = item.isActive(pathname);

  const handleClick = () => {
    onNavigate();
  };

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-center p-3 rounded-full transition-all duration-200 ${
        isActive ? "bg-organiser-light-gray" : ""
      }`}
      onClick={handleClick}
    >
      <item.icon
        className={`w-6 h-6 transition-colors ${
          isActive ? "text-organiser-dark-gray-text stroke-[1.1]" : "text-organiser-light-gray stroke-1"
        }`}
      />
    </Link>
  );
};

const DropdownNavButton = ({ item, pathname, onNavigate }: DropdownNavButtonProps) => {
  const isActive = item.isActive(pathname);
  const { openDropdown, setOpenDropdown, closeAllDropdowns } = useDropdown();
  const dropdownId = `dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
  const isMenuOpen = openDropdown === dropdownId;

  const handleDropdownToggle = () => {
    if (isMenuOpen) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdownId);
    }
  };

  const handleSubItemClick = () => {
    closeAllDropdowns();
    onNavigate();
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={`flex items-center justify-center p-3 rounded-full transition-all duration-200 ${
          isActive ? "bg-organiser-light-gray" : ""
        }`}
        onClick={handleDropdownToggle}
      >
        <item.icon
          className={`w-6 h-6 transition-colors ${
            isActive ? "text-organiser-dark-gray-text stroke-[1.1]" : "text-organiser-light-gray stroke-1"
          }`}
        />
      </MenuButton>

      <Transition
        as={Fragment}
        show={isMenuOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-52 origin-bottom divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-1 py-1">
            {item.subItems.map((subItem) => (
              <Menu.Item key={subItem.href}>
                {({ active }) => (
                  <Link
                    href={subItem.href}
                    className={`${
                      active ? "text-core-text bg-core-hover" : "text-core-text"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleSubItemClick}
                  >
                    <subItem.icon className="w-6 stroke-1 mr-2" />
                    {subItem.label}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default function OrganiserMobileNavbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close all dropdowns when pathname changes (navigation occurs)
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  const closeAllDropdowns = () => {
    setOpenDropdown(null);
  };

  const handleNavigate = () => {
    closeAllDropdowns();
  };

  // Navigation configuration - easy to extend and modify
  const navigationConfig: (NavItem | DropdownNavItem)[] = [
    {
      icon: HomeIcon,
      href: "/organiser/dashboard",
      label: "Dashboard",
      isActive: (path) => path.startsWith("/organiser/dashboard"),
    },
    {
      icon: CalendarIcon,
      label: "Events",
      isActive: (path) => path.startsWith("/organiser/event") || path.startsWith("/organiser/recurring-events"),
      subItems: [
        {
          icon: StarIcon,
          href: "/organiser/event/dashboard",
          label: "Event Dashboard",
          isActive: (path) => path.startsWith("/organiser/event/dashboard"),
        },
        {
          icon: ArrowPathIcon,
          href: "/organiser/recurring-events",
          label: "Recurring Events",
          isActive: (path) => path.startsWith("/organiser/recurring-events"),
        },
        {
          icon: LinkIcon,
          href: "/organiser/event/custom-links",
          label: "Custom Event Links",
          isActive: (path) => path.startsWith("/organiser/event/custom-links"),
        },
      ],
    },
    {
      icon: UserIcon,
      href: "/organiser/settings",
      label: "Settings",
      isActive: (path) => path.startsWith("/organiser/settings"),
    },
  ];

  const renderNavItem = (item: NavItem | DropdownNavItem, index: number) => {
    // Check if item has subItems (is a dropdown)
    if ("subItems" in item) {
      return (
        <DropdownNavButton key={`${item.label}-${index}`} item={item} pathname={pathname} onNavigate={handleNavigate} />
      );
    }

    // Regular nav item
    return <NavButton key={`${item.label}-${index}`} item={item} pathname={pathname} onNavigate={handleNavigate} />;
  };

  const dropdownContextValue: DropdownContextType = {
    openDropdown,
    setOpenDropdown,
    closeAllDropdowns,
  };

  return (
    <DropdownContext.Provider value={dropdownContextValue}>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-12 mb-8 h-[3.75rem]">
          <div className="bg-organiser-dark-gray-text/80 backdrop-blur-sm rounded-full h-full">
            <div className="px-2 flex justify-between items-center h-full">{navigationConfig.map(renderNavItem)}</div>
          </div>
        </div>
      </nav>
    </DropdownContext.Provider>
  );
}
