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

const PreviewFormContent: React.FC<PreviewFormContentProps> = ({
  user,
  form,
}) => {
  useEffect(() => {
    // Log the user data to the console when the component mounts
    console.log(user);
  }, [user]);

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
          {form.cost}
        </div>
        <div className="flex flex-col">
          <div className="font-bold">Total capacity of the event:</div>
          {form.people}
        </div>
      </div>

      <FormWrapper>
        <div className="flex justify-center">
          <EventCard
            eventId=""
            image="https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fstv%2F364809572_6651230408261559_5428994326794147594_n.png.jpeg?alt=media&token=9020aa75-976a-430f-a96e-d763f5b4bada"
            name={form.name}
            organiser={user}
            startTime={Timestamp.fromDate(myDate)}
            location={form.location}
            price={form.cost}
            vacancy={form.people}
          />
        </div>
      </FormWrapper>
    </div>
  );
};

export const PreviewForm: React.FC<PreviewFormProps> = ({
  form,
  updateField,
}) => {
  const { user } = useUser();

  console.log(user);

  return <PreviewFormContent user={user} form={form} />;
};
