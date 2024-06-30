<<<<<<< HEAD
=======
import { FormData } from "@/app/(footer)/event/create/page";
>>>>>>> cb9c93364756508bbdd3bce5b6c7f994a04fa90c
import EventCard from "@/components/events/EventCard";
import { UserData } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { FormWrapper } from "./FormWrapper";
import { FormData } from "@/interfaces/FormTypes";

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
    <div className="lg:grid lg:grid-cols-3 mt-20 space-y-6">
      <div className="md:grid md:grid-cols-2 gap-6 mt-0 items-start mb-8 md:col-span-2 space-y-6">
        <div className="col-span-1 mt-6 mx-2 space-y-6">
        <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">
              Name and Date
            </div>
            <div className="flex justify-between">
              <p className="text-m">Name: </p>
              <p className="text-m">{form.name}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-m">Date: </p>
              <p className="text-m">{form.date} </p>
            </div>
          </div>
          <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">Location</div>
            <p className="text-m">{form.location}</p>
          </div>
          <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">
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
          </div>
        </div>

        <div className="col-span-1 mt-6 mx-2 space-y-6">
          <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">Sport</div>
            <p className="text-m">{form.sport}</p>
          </div>

          <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">Price</div>
            <p className="text-m">{form.price}</p>
          </div>

          <div>
            <div className="text-lg lg:text-lg font-bold mb-2 border-b-2 border-gray-300 text-gray-600">Capacity</div>
            <p className="text-m">{form.capacity}</p>
          </div>
        </div>

        <div className="col-span-2 mx-2">
          <div className="text-lg lg:text-lg font-bold border-b-2 border-gray-300 pb-1 text-gray-600">Description</div>
          <div className="text-m" dangerouslySetInnerHTML={{ __html: form.description }}></div>
        </div>
      </div>
      <div className="mx-2 col-span-1 flex justify-center lg:justify-end xl:justify-center">
        <div className="w-full md:w-fit">
          <div className="text-lg lg:text-lg font-bold mb-2 text-gray-600 text-center">Your EventCard preview:</div>
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
    </div>
  );
};
