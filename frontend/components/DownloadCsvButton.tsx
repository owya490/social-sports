import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { CSVLink } from "react-csv";

interface DownloadCsvButtonProps {
  data: object[];
  headers: { label: string; key: string }[];
  filename: string;
  label?: string;
  className?: string;
  /** Small muted control for organiser v2 toolbars. */
  compact?: boolean;
}

const DownloadCsvButton = ({
  data,
  headers,
  filename,
  label = "Download as CSV",
  className = "",
  compact = false,
}: DownloadCsvButtonProps) => {
  const compactLabel = label === "Download as CSV" ? "CSV" : label;
  return (
    <CSVLink
      data={data}
      headers={headers}
      filename={filename}
      aria-label={compact ? "Export as CSV" : undefined}
      className={
        compact
          ? `inline-flex items-center gap-1 rounded-lg border border-border bg-background px-1.5 py-1 text-xs font-medium text-foreground-muted font-sans hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`
          : `inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${className}`
      }
    >
      <ArrowDownTrayIcon className={compact ? "h-3.5 w-3.5" : "md:mr-2 h-5 w-5"} />
      {compact ? <span>{compactLabel}</span> : <span className="hidden md:block">{label}</span>}
    </CSVLink>
  );
};

export default DownloadCsvButton;
