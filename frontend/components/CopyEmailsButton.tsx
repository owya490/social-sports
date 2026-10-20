"use client";

import { Logger } from "@/observability/logger";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const logger = new Logger("CopyEmailsButton");

interface CopyEmailsButtonProps {
  emails: string[];
  label?: string;
  className?: string;
  /** Small muted control for organiser v2 toolbars. */
  compact?: boolean;
}

const CopyEmailsButton = ({
  emails,
  label = "Copy emails",
  className = "",
  compact = false,
}: CopyEmailsButtonProps) => {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const copyEmails = async () => {
    if (emails.length === 0) {
      return;
    }
    try {
      await navigator.clipboard.writeText(emails.join("\n"));
      setCopied(true);
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimeoutRef.current = null;
      }, 1600);
    } catch (error) {
      logger.error(`Failed to copy emails: ${error}`);
      toast.error("Could not copy emails");
    }
  };

  const ariaLabel = copied
    ? "Emails copied"
    : emails.length === 1
      ? "Copy 1 email"
      : `Copy ${emails.length} emails`;

  return (
    <button
      type="button"
      onClick={() => void copyEmails()}
      disabled={emails.length === 0}
      aria-label={ariaLabel}
      className={
        compact
          ? `inline-flex items-center gap-1 rounded-lg border border-border bg-background px-1.5 py-1 text-xs font-medium text-foreground-muted font-sans hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${className}`
          : `inline-flex items-center justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 disabled:opacity-60 ${className}`
      }
    >
      {copied ? (
        <CheckIcon className={compact ? "h-3.5 w-3.5" : "md:mr-2 h-5 w-5"} aria-hidden />
      ) : (
        <ClipboardDocumentIcon className={compact ? "h-3.5 w-3.5" : "md:mr-2 h-5 w-5"} aria-hidden />
      )}
      {compact ? <span>{copied ? "Copied" : label}</span> : <span className="hidden md:block">{copied ? "Copied" : label}</span>}
    </button>
  );
};

export default CopyEmailsButton;
