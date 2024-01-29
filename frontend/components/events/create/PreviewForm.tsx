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
    <div className="md:grid md:grid-cols-2 mt-20 items-start mb-8">
    <div className="justify-start col-start-1 col-span-1 md:col-start-2 md:row-start-1 md:row-span-4 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg">
        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 lg:mt-3">Name of the Event</div>
        </div>
        <ul className="w-full">{form.name}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Location of the event
          </div>
        </div>
        <ul className="w-full">{form.location}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Start Time of event
          </div>
        </div>
        <ul className="w-full">{form.startTime}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Price of the Event
          </div>
        </div>
        <ul className="w-full">{form.cost}</ul>

        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Total Capacity of the Event
          </div>
        </div>
        <ul className="w-full">{form.people}</ul>
        <div
          className="mb-2 text-xl lg:text-2xl"
          style={{
            fontWeight: 400,
            borderBottom: "2px solid #ccc",
            width: "100%",
          }}
        >
          <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">
            Description of the Event
          </div>
        </div>
        <ul className="w-full">{form.description}</ul>
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
