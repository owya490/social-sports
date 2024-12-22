import { EventId } from "@/interfaces/EventTypes";
import { Table } from "@mantine/core";

interface RecurringTemplatePastEventsProps {
  pastEvents: Record<number, EventId>;
}

export const RecurringTemplatePastEvents = ({ pastEvents }: RecurringTemplatePastEventsProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6 min-h-96">
      <div className="text-2xl font-bold">Past Events</div>
      <Table>
        <thead>
          <tr>
            <th>Event Start Date</th>
            <th>Event Id</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pastEvents).map((event, idx) => {
            // Adjusting the input to make it in a proper ISO string format (e.g., "2024-12-02T21:00:06+11:00")
            const isoDateString = event[0].replace(" ", "T").replace(" GMT", "").concat(":00");
            const date = new Date(isoDateString);
            return (
              <tr key={idx}>
                <td>{date.toDateString()}</td>
                <td>
                  <a className="underline text-blue-600" href={`/event/${event[1]}`}>
                    {event[1]}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
