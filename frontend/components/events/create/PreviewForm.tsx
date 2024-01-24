import { FormData } from "@/app/event/create/page";
import EventCard from "@/components/EventCard";
import { Timestamp } from "firebase/firestore";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  form: FormData;
};

type PreviewFormProps = BasicData & {
  updateField: (fields: Partial<FormData>) => void;
};

export function PreviewForm({ form, updateField }: PreviewFormProps) {
  const dateString = form.date + " " + form.startTime;
  // Split the string into date and time parts
  var [datePart, timePart] = dateString.split(" ");

  // Split the date part into year, month, and day
  var [year, month, day] = datePart.split("-");

  // Split the time part into hours and minutes
  var [hours, minutes] = timePart.split(":");

  // Create a new Date object using the extracted values
  var myDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
  return (
    <FormWrapper>
      <div className="my-32">
        <EventCard
          eventId={""}
          image={form.image}
          name={form.name}
          organiser={null}
          startTime={Timestamp.fromDate(myDate)}
          location={form.location}
          price={form.cost}
          vacancy={form.people}
        />
      </div>
    </FormWrapper>
  );
}
