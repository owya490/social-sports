"use client";

import CopyEmailsButton, { useCopyEmails } from "@/components/CopyEmailsButton";
import DownloadCsvButton from "@/components/DownloadCsvButton";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";
import { CSVLink } from "react-csv";

type CsvHeader = { label: string; key: string };

type AttendeeListActionsProps = {
  emails: string[];
  csvData: object[];
  csvHeaders: CsvHeader[];
  csvFilename: string;
};

function menuItemClass(focus: boolean, disabled = false) {
  return `${
    focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
  } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium font-sans ${
    disabled ? "opacity-60" : ""
  }`;
}

export function AttendeeListActions({
  emails,
  csvData,
  csvHeaders,
  csvFilename,
}: AttendeeListActionsProps) {
  return (
    <div className="shrink-0">
      <div className="hidden items-center gap-1.5 sm:flex">
        <CopyEmailsButton compact emails={emails} />
        <DownloadCsvButton compact data={csvData} headers={csvHeaders} filename={csvFilename} />
      </div>
      <AttendeeActionsMenu
        emails={emails}
        csvData={csvData}
        csvHeaders={csvHeaders}
        csvFilename={csvFilename}
      />
    </div>
  );
}

function AttendeeActionsMenu({
  emails,
  csvData,
  csvHeaders,
  csvFilename,
}: AttendeeListActionsProps) {
  const downloadRef = useRef<HTMLDivElement>(null);
  const { copied, copyEmails, ariaLabel, empty } = useCopyEmails(emails);
  const downloadCsv = () => {
    downloadRef.current?.querySelector("a")?.click();
  };

  return (
    <Menu as="div" className="relative shrink-0 sm:hidden">
      <MenuButton
        type="button"
        aria-label="Attendee actions"
        className="rounded-lg p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        modal={false}
        className="z-[100] w-44 origin-top-right rounded-xl border border-border bg-background p-1 shadow-lg outline-none [--anchor-gap:4px] data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <MenuItem disabled={empty}>
          {({ focus }) => (
            <button
              type="button"
              disabled={empty}
              aria-label={ariaLabel}
              onClick={(event) => {
                // Headless UI closes on click unless default is prevented, which lets this row show "Copied".
                event.preventDefault();
                void copyEmails();
              }}
              className={menuItemClass(focus, empty)}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {copied ? "Copied" : "Copy emails"}
            </button>
          )}
        </MenuItem>
        <MenuItem>
          {({ focus }) => (
            <button type="button" onClick={downloadCsv} className={menuItemClass(focus)}>
              <ArrowDownTrayIcon className="h-4 w-4 shrink-0" aria-hidden />
              Download CSV
            </button>
          )}
        </MenuItem>
      </MenuItems>
      <div ref={downloadRef} className="hidden">
        <CSVLink data={csvData} headers={csvHeaders} filename={csvFilename} tabIndex={-1} aria-hidden />
      </div>
    </Menu>
  );
}
