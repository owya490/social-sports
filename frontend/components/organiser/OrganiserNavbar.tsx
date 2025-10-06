"use client";

import { evaluateFulfilmentSessionEnabled } from "@/services/src/fulfilment/fulfilmentServices";
import { useUser } from "@components/utility/UserContext";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import {
  ArrowPathIcon,
  CalendarIcon,
  CameraIcon,
  HomeIcon,
  LinkIcon,
  PencilSquareIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, ReactNode } from "react";

interface ResponsiveTooltipProps {
  content: string;
  children: ReactNode;
  disabled?: boolean;
}

const ResponsiveTooltip = ({ content, children, disabled = false }: ResponsiveTooltipProps) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="hidden sm:block">
        <Tooltip content={content} placement="right" className="absolute left-full ml-2" interactive={false}>
          {children}
        </Tooltip>
      </div>
      <div className="block sm:hidden">
        <Tooltip content={content} placement="top" interactive={false}>
          {children}
        </Tooltip>
      </div>
    </div>
  );
};

interface NavButtonProps {
  href: string;
  isActive: boolean;
  tooltipContent: string;
  children: ReactNode;
}

const NavButton = ({ href, isActive, tooltipContent, children }: NavButtonProps) => {
  return (
    <ResponsiveTooltip content={tooltipContent}>
      <Link
        href={href}
        className={`
          flex justify-center items-center
          /* Mobile: Enhanced floating button design */
          h-12 w-12 rounded-xl
          transition-all duration-200 ease-out
          ${isActive ? "bg-black/10 shadow-inner" : "hover:bg-black/5 active:bg-black/10 active:scale-95"}
          /* Desktop: Traditional design */
          sm:h-10 sm:w-10 sm:rounded-md sm:shadow-none
          ${isActive ? "sm:bg-core-hover" : "sm:hover:bg-core-hover sm:active:scale-100"}
        `}
      >
        {children}
      </Link>
    </ResponsiveTooltip>
  );
};

export default function OrganiserNavbar() {
  const { user } = useUser();
  const currPage = usePathname();

  return (
    <nav
      className="
        /* Mobile: Modern floating design */
        fixed bottom-4 left-6 right-6 z-40
        bg-white/80 backdrop-blur-lg border border-gray-200/50
        rounded-2xl shadow-lg shadow-black/10
        /* Desktop: Traditional sidebar */
        sm:bg-white sm:backdrop-blur-none sm:border-r-[1px] sm:border-core-outline
        sm:bottom-auto sm:inset-x-auto sm:left-0 sm:h-screen sm:rounded-none sm:shadow-none
      "
      role="navigation"
      aria-label="Organiser navigation"
    >
      <div
        className="
        /* Mobile: Horizontal floating layout */
        flex justify-center items-center h-16 px-6
        /* Desktop: Vertical sidebar layout */
        sm:h-auto sm:w-14 sm:flex-col sm:mt-14 sm:space-y-3 sm:space-x-0 sm:px-0
        space-x-4
      "
      >
        <NavButton
          href="/organiser/dashboard/"
          isActive={currPage.startsWith("/organiser/dashboard")}
          tooltipContent="Dashboard"
        >
          <HomeIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>
        <Menu as="div" className="relative inline-block text-left">
          {({ open }) => {
            return (
              <>
                <div className="flex items-center">
                  <ResponsiveTooltip content="Events" disabled={open}>
                    <MenuButton
                      className={`
                        flex justify-center items-center
                        /* Mobile: Enhanced floating button design */
                        h-12 w-12 rounded-xl
                        transition-all duration-200 ease-out
                        ${
                          currPage.startsWith("/organiser/event")
                            ? "bg-black/10 shadow-inner"
                            : "hover:bg-black/5 active:bg-black/10 active:scale-95"
                        }
                        /* Desktop: Traditional design */
                        sm:h-10 sm:w-10 sm:rounded-md sm:shadow-none
                        ${
                          currPage.startsWith("/organiser/event")
                            ? "sm:bg-core-hover"
                            : "sm:hover:bg-core-hover sm:active:scale-100"
                        }
                      `}
                    >
                      <CalendarIcon className="w-6 stroke-1 stroke-core-text" />
                    </MenuButton>
                  </ResponsiveTooltip>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems
                    className="
                    absolute w-52 h-fit focus:outline-none
                    /* Mobile: Floating above the navbar */
                    bottom-16 left-1/2 transform -translate-x-1/2
                    bg-white/95 backdrop-blur-lg border border-gray-200/50
                    rounded-2xl shadow-xl shadow-black/20
                    /* Desktop: Traditional positioning */
                    md:left-16 md:top-0 md:bottom-auto md:transform-none md:translate-x-0
                    md:bg-white md:backdrop-blur-none md:border-gray-100
                    md:rounded-md md:shadow-lg md:shadow-black/10
                    divide-y divide-gray-100/50 md:divide-gray-100
                  "
                  >
                    <div className="px-1 py-1 ">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/organiser/event/dashboard"
                            className={`${
                              active ? "text-core-text bg-core-hover" : "text-core-text"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <StarIcon className="w-6 stroke-1 mr-2" />
                            Event Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/organiser/event/recurring-events"
                            className={`${
                              active ? "text-core-text bg-core-hover" : "text-core-text"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <ArrowPathIcon className="w-6 stroke-1 mr-2" />
                            Recurring Events
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/organiser/event/custom-links"
                            className={`${
                              active ? "text-core-text bg-core-hover" : "text-core-text"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <LinkIcon className="w-6 stroke-1 mr-2" />
                            Custom Event Links
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                  </MenuItems>
                </Transition>
              </>
            );
          }}
        </Menu>{" "}
        {evaluateFulfilmentSessionEnabled(user.userId, "") && (
          <NavButton
            href={`/organiser/forms/gallery`}
            isActive={currPage.startsWith("/organiser/forms/gallery")}
            tooltipContent="Forms"
          >
            <PencilSquareIcon className="w-6 stroke-1 stroke-core-text" />
          </NavButton>
        )}
        <NavButton
          href="/organiser/gallery"
          isActive={currPage.startsWith("/organiser/gallery")}
          tooltipContent="Gallery"
        >
          <CameraIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>
        <NavButton
          href="/organiser/settings"
          isActive={currPage.startsWith("/organiser/settings")}
          tooltipContent="Settings"
        >
          <UserIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>
      </div>
    </nav>
  );
}
