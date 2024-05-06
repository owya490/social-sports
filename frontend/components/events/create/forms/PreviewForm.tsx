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

export const PreviewForm = ({ form, user, imagePreviewUrl, updateField }: PreviewFormProps) => {
  const dateString = form.date + " " + form.startTime;
  var [datePart, timePart] = dateString.split(" ");
  var [year, month, day] = datePart.split("-");
  var [hours, minutes] = timePart.split(":");
  var myDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));

  return (
    <div className="md:grid md:grid-cols-3 gap-6 mt-20 items-start mb-8">
      <div className="col-span-1 mt-6">
        <div className="text-xl lg:text-xl font-semibold mb-2 border-b-2 border-gray-300 pb-1">Name</div>
        <p className="text-m">{form.name}</p>

        <div className="text-xl lg:text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-300 pb-1">Location</div>
        <p className="text-m">{form.location}</p>

        <div className="text-xl lg:text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-300 pb-1">
          Details of Time
        </div>
        <div className="flex justify-between">
          <p className="text-m">Time Start: </p>
          <p className="text-m">{form.startTime}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-m">Time End: </p>
          <p className="text-m">{form.endTime} </p>
        </div>
        <div className="text-xl lg:text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-300 pb-1">Sport</div>
        <p className="text-m">{form.sport}</p>
      </div>

      <div className="col-span-1 mt-6">
        <div className="text-xl lg:text-xl font-semibold mb-2 border-b-2 border-gray-300 pb-1">Price</div>
        <p className="text-m">{form.price}</p>

        <div className="text-xl lg:text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-300 pb-1">Capacity</div>
        <p className="text-m">{form.capacity}</p>

        <div className="text-xl lg:text-xl font-semibold mt-6 mb-2 border-b-2 border-gray-300 pb-1">Description</div>
        <div className="text-m" dangerouslySetInnerHTML={{ __html: form.description }}></div>
      </div>

      <div className="col-span-1 mt-6 mx-10">
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
    </div>
  );
};
