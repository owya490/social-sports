import { UserCircleIcon } from "@heroicons/react/20/solid";
import { ReactNode } from "react";

export const MANUAL_ORDER_ID_PREFIX = "manual-";

interface AttendeeRowData {
  key: string;
  ticketCount: number;
  name: string;
  email: string;
  phone: string | null;
}

interface AttendeeListTableProps<T extends AttendeeRowData> {
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  renderActions: (item: T) => ReactNode;
}

const AttendeeListTable = <T extends AttendeeRowData>({
  data,
  loading = false,
  emptyMessage = "No attendees",
  loadingMessage = "Loading attendees...",
  renderActions,
}: AttendeeListTableProps<T>) => {
  if (loading) {
    return <div className="text-center py-8 text-organiser-title-gray-text">{loadingMessage}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-organiser-title-gray-text">{emptyMessage}</div>;
  }

  return (
    <div className="">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-organiser-title-gray-text">
            <th className="text-left py-2 px-1 md:px-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
              Tickets
            </th>
            <th className="text-left py-2 px-1 md:px-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
              Name
            </th>
            <th className="text-left py-2 px-1 md:px-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
              Email
            </th>
            <th className="text-left py-2 px-1 md:px-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
              Phone
            </th>
            <th className="text-left py-2 px-1 md:px-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.key} className="border-b border-gray-200">
              <td className="py-2 px-1 md:px-2 text-center text-xs md:text-base">{item.ticketCount}</td>
              <td className="py-2 px-1 md:px-2 text-xs md:text-base">
                <div className="flex flex-row items-center">
                  <UserCircleIcon className="w-8 md:w-10 rounded-full hidden lg:block mr-2 flex-shrink-0" />
                  <div className="truncate">
                    <div>{item.name}</div>
                    {(item as any).order?.orderId?.startsWith("manual-") && (
                      <div className="text-[10px] text-gray-500 -mt-1 leading-tight">Direct Addition</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-2 px-1 md:px-2 text-xs md:text-base break-all">{item.email}</td>
              <td className={`py-2 px-1 md:px-2 text-xs md:text-base break-all ${!item.phone ? "text-gray-300" : ""}`}>
                {!item.phone ? "N/A" : item.phone}
              </td>
              <td className="py-2 px-1 md:px-2 relative">{renderActions(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendeeListTable;
