import { FormData } from "@/app/event/create/page";
import EventCard from "@/components/EventCard";
import { Timestamp } from "firebase/firestore";
import { FormWrapper } from "./FormWrapper";
import React, { useEffect, useState } from "react";
import { UserType, useUser } from "../../utility/UserContext";
import { UserData } from "@/interfaces/UserTypes";
import { User } from "firebase/auth";

type BasicData = {
  form: FormData;
};

type PreviewFormProps = BasicData & {
  updateField: (fields: Partial<FormData>) => void;
};

type PreviewFormContentProps = {
  user: UserData; // Replace 'any' with the actual type of your user data
  form: FormData; // Define the type of the 'form' prop
};

const PreviewFormContent: React.FC<PreviewFormContentProps> = ({ user, form }) => {
  useEffect(() => {
    // Log the user data to the console when the component mounts
    console.log(user);
  }, [user]);

  // State to store the user data
  // const [organiserData, setOrganiserData] = useState<UserData>(null);

  // useEffect(() => {
  //   // Set organiserData when user data changes
  //   setOrganiserData(user);
  // }, [user]);

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
          image={"https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fstv%2F364809572_6651230408261559_5428994326794147594_n.png.jpeg?alt=media&token=9020aa75-976a-430f-a96e-d763f5b4bada"}
          name={form.name}
          organiser={user}
          startTime={Timestamp.fromDate(myDate)}
          location={form.location}
          price={form.cost}
          vacancy={form.people}
        />
      </div>
    </FormWrapper>
  );
};

export const PreviewForm: React.FC<PreviewFormProps> = ({ form, updateField }) => {
  const { user } = useUser(); 
  
  console.log(user);

  return <PreviewFormContent user={user} form={form} />;
};
