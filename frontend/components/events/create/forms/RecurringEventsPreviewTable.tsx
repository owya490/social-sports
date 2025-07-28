import { Card, Typography } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";

const TABLE_HEAD = ["#", "Recurrence Date"];

interface RecurringEventsPreviewTableProps {
  recurrenceDates: Timestamp[];
}

export const RecurringEventsPreviewTable = ({ recurrenceDates }: RecurringEventsPreviewTableProps) => {
  return (
    <Card className="w-full overflow-hidden overflow-y-auto h-96">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head) => (
              <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                  {head}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="">
          {recurrenceDates.map((date, index) => {
            const isLast = index === recurrenceDates.length - 1;
            const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

            return (
              <tr key={index}>
                <td className={classes}>
                  <Typography variant="small" color="blue-gray" className="font-normal">
                    {index + 1}
                  </Typography>
                </td>
                <td className={classes}>
                  <Typography variant="small" color="blue-gray" className="font-normal">
                    {date.toDate().toDateString()}
                  </Typography>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};
