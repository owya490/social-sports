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
    <div className="md:grid md:grid-cols-2 mt-20 items-start mb-8">
      <div className="justify-start col-start-1 col-span-1 md:col-start-2 md:row-start-1 md:row-span-4 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg ml-8 md:ml-4 sm:ml-8">
        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 lg:mt-3">Name of the Event</div>
        </div>
        <ul className="text-sm w-full">{form.name}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Location of the event
          </div>
        </div>
        <ul className="text-sm w-full">{form.location}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Start Time of event
          </div>
        </div>
        <ul className="text-sm w-full">{form.startTime}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Price of the Event
          </div>
        </div>
        <ul className="text-sm w-full">{form.price}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Total Capacity of the Event
          </div>
        </div>
        <ul className="text-sm w-full">{form.capacity}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="text-sm mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Description of the Event
          </div>
        </div>
        <ul className="text-sm w-full">{form.description}</ul>
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
            startTime={Timestamp.fromDate(myDate)}
            location={form.location}
            price={form.price}
            vacancy={form.capacity}
          />
        </div>
      </FormWrapper>
    </div>
  );
};
