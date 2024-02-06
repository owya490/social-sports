import { FormData } from "@/app/event/create/page";
import EventCard from "@/components/events/EventCard";
import { UserData } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  form: FormData;
  user: UserData;
  imagePreviewUrl: string;
};

type PreviewFormProps = BasicData & {
  updateField: (fields: Partial<FormData>) => void;
};

export const PreviewForm = ({
  form,
  user,
  imagePreviewUrl,
  updateField,
}: PreviewFormProps) => {
  const dateString = form.date + " " + form.startTime;
  var [datePart, timePart] = dateString.split(" ");
  var [year, month, day] = datePart.split("-");
  var [hours, minutes] = timePart.split(":");
  var myDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );

  return (
    <div className="md:grid md:grid-cols-2 mt-4 items-start">
      <div className="flex flex-col items-center mb-12 md:mb-0 md:mt-16">
        <div className="flex flex-col">
          <div className="font-bold">Name of event:</div>
          {form.name}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Location of event:</div>
          {form.location}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Start Time of event:</div>
          {form.startTime}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Price of event:</div>
          {form.price}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Total capacity of the event:</div>
          {form.capacity}
        </div>
      </div>

      <FormWrapper>
        <div className="flex justify-center">
          <EventCard
            eventId=""
            image={
              imagePreviewUrl === ""
                ? "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-sports.jpeg?alt=media&token=045e6ecd-8ca7-4c18-a136-71e4aab7aaa5"
                : imagePreviewUrl
            }
            name={form.name}
            organiser={user}
            startDate={Timestamp.fromDate(myDate)}
            location={form.location}
            price={form.price}
            vacancy={form.capacity}
          />
        </div>
      </FormWrapper>
    </div>
  );
};
