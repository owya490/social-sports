import React from "react";
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
      <span className="hidden md:block">{label}</span>
    </CSVLink>
  );
};

export default DownloadCsvButton;
