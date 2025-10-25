"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { ReactNode } from "react";

type ModalState = "success" | "error" | "warning" | "neutral";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  state?: ModalState;
  customIcon?: ReactNode;
  customIconBgColor?: string;
  customIconTextColor?: string;
  children?: ReactNode;
  primaryButton?: {
    text: string;
    onClick: () => void;
    className?: string;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
    className?: string;
  };
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  state = "neutral",
  customIcon,
  customIconBgColor,
  customIconTextColor,
  children,
  primaryButton,
  secondaryButton,
  maxWidth = "sm",
}: ModalProps) {
  const maxWidthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  // State configurations
  const stateConfig = {
    success: {
      icon: <CheckCircleIcon />,
      iconBgColor: "bg-green-100 dark:bg-green-500/10",
      iconTextColor: "text-green-600 dark:text-green-400",
      primaryButtonClass:
        "inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-green-500 dark:shadow-none dark:hover:bg-green-400 dark:focus-visible:outline-green-500",
    },
    error: {
      icon: <XCircleIcon />,
      iconBgColor: "bg-red-100 dark:bg-red-500/10",
      iconTextColor: "text-red-600 dark:text-red-400",
      primaryButtonClass:
        "inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400 dark:focus-visible:outline-red-500",
    },
    warning: {
      icon: <ExclamationTriangleIcon />,
      iconBgColor: "bg-yellow-100 dark:bg-yellow-500/10",
      iconTextColor: "text-yellow-600 dark:text-yellow-400",
      primaryButtonClass:
        "inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-yellow-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 dark:bg-yellow-500 dark:shadow-none dark:hover:bg-yellow-400 dark:focus-visible:outline-yellow-500",
    },
    neutral: {
      icon: <InformationCircleIcon />,
      iconBgColor: "bg-gray-100 dark:bg-gray-500/10",
      iconTextColor: "text-gray-600 dark:text-gray-400",
      primaryButtonClass:
        "inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500",
    },
  };

  // Get current state configuration
  const currentConfig = stateConfig[state];

  // Use custom values if provided, otherwise use state defaults
  const finalIcon = customIcon || currentConfig.icon;
  const finalIconBgColor = customIconBgColor || currentConfig.iconBgColor;
  const finalIconTextColor = customIconTextColor || currentConfig.iconTextColor;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full ${maxWidthClasses[maxWidth]} sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10`}
          >
            <div>
              {finalIcon && (
                <div className={`mx-auto flex size-12 items-center justify-center rounded-full ${finalIconBgColor}`}>
                  <div className={`size-6 ${finalIconTextColor}`}>{finalIcon}</div>
                </div>
              )}
              <div className={`${finalIcon ? "mt-3" : ""} text-center sm:mt-5`}>
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                  {title}
                </DialogTitle>
                {description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                )}
                {children && <div className="mt-4">{children}</div>}
              </div>
            </div>

            {(primaryButton || secondaryButton) && (
              <div
                className={`${finalIcon || description || children ? "mt-5 sm:mt-6" : "mt-3"} ${
                  secondaryButton ? "sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3" : ""
                }`}
              >
                {primaryButton && (
                  <button
                    type="button"
                    onClick={primaryButton.onClick}
                    className={
                      primaryButton.className ||
                      `${currentConfig.primaryButtonClass} ${secondaryButton ? "sm:col-start-2" : ""}`
                    }
                  >
                    {primaryButton.text}
                  </button>
                )}
                {secondaryButton && (
                  <button
                    type="button"
                    onClick={secondaryButton.onClick}
                    className={
                      secondaryButton.className ||
                      `mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600`
                    }
                  >
                    {secondaryButton.text}
                  </button>
                )}
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
