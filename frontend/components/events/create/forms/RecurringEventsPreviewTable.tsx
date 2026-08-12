import { Timestamp } from "firebase/firestore";

const TABLE_HEAD = ["#", "Recurrence Date"];

interface RecurringEventsPreviewTableProps {
  recurrenceDates: Timestamp[];
}

export const RecurringEventsPreviewTable = ({ recurrenceDates }: RecurringEventsPreviewTableProps) => {
  return (
    <div className="w-full overflow-hidden overflow-y-auto max-h-96 rounded-2xl border border-border bg-background">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head) => (
              <th key={head} className="border-b border-border bg-surface px-4 py-3">
                <span className="text-xs font-medium text-foreground-muted font-sans leading-none">{head}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recurrenceDates.map((date, index) => {
            const isLast = index === recurrenceDates.length - 1;
            const classes = isLast ? "px-4 py-3" : "px-4 py-3 border-b border-border";

            return (
              <tr key={index} className="hover:bg-surface-hover transition-colors">
                <td className={classes}>
                  <span className="text-sm text-foreground-secondary font-sans tabular-nums">{index + 1}</span>
                </td>
                <td className={classes}>
                  <span className="text-sm text-foreground font-sans">{date.toDate().toDateString()}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
