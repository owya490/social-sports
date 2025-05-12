import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { CSVLink } from "react-csv";

interface DownloadCsvButtonProps {
  data: object[];
  headers: { label: string; key: string }[];
  filename: string;
  label?: string;
  className?: string;
}

const DownloadCsvButton = ({
  data,
  headers,
  filename,
  label = "Download as CSV",
  className = "",
}: DownloadCsvButtonProps) => {
  return (
    <CSVLink
      data={data}
      headers={headers}
      filename={filename}
      className={`inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${className}`}
    >
      <ArrowDownTrayIcon className="md:mr-2 h-5 w-5" />
      <span className="hidden md:block">{label}</span>
    </CSVLink>
  );
};

export default DownloadCsvButton;
