import { EventId } from "@/interfaces/EventTypes";
import { Table } from "@mantine/core";

interface RecurringTemplatePastEventsProps {
  pastEvents: Record<number, EventId>;
}

export const RecurringTemplatePastEvents = ({ pastEvents }: RecurringTemplatePastEventsProps) => {
  // Adjusting the input to make it in a proper ISO string format (e.g., "2024-12-02T21:00:06+11:00")
  function toDate(dateString: string) {
    const isoDateString = dateString.replace(" ", "T").replace(" GMT", "").concat(":00");
    console.log(isoDateString);
    return new Date(isoDateString);
  }

  return (
    <div className="flex flex-col space-y-4 mb-6 min-h-96">
      <div className="text-2xl font-bold">Past Events</div>
      <Table>
        <thead>
          <tr>
            <th>Event Start Date</th>
            <th>Event Id</th>
            <th>Organiser Page</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pastEvents)
            // sort by date
            .sort((a, b) => toDate(a[0]).getTime() - toDate(b[0]).getTime())
            .map((event, idx) => {
              return (
                <tr key={idx}>
                  <td>{toDate(event[0]).toDateString()}</td>
                  <td>
                    <a className="underline text-blue-600" href={`/event/${event[1]}`}>
                      {event[1]}
                    </a>
                  </td>
                  <td>
                    <a className="underline text-blue-600" href={`/organiser/event/${event[1]}`}>
                      Organiser Page
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
