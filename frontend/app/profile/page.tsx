"use client";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import React, { Fragment, useState } from "react";
import DP from "./../../public/images/Ashley & Owen.png";

const initialProfileData = {
  firstName: "Owen",
  lastName: "Yang",
  location: "Sydney, Australia",
  phoneNumber: "0468368618",
  email: "owya490@gmail.com",
  birthday: "23-07-2002", // DD-MM-YYYY format
  age: 21,
  password: "danielinthesky",
};

const Profile = () => {
  const [editable, setEditable] = useState(false);
  const [editedData, setEditedData] = useState({ ...initialProfileData });
  const handleEditClick = () => {
    if (editable) {
      setEditedData({ ...initialProfileData });
    }
    setEditable(!editable);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "birthday") {
      setEditedData((prevData) => ({
        ...prevData,
        birthday: value,
      }));
    } else {
      setEditedData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSaveClick = () => {
    console.log("Saving changes:", editedData);
    setEditable(false);
  };

  const renderEditableField = (label, name, type = "text") => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {type === "date" ? (
        <input
          type={type}
          name={name}
          value={formatDateForInput(editedData[name])}
          onChange={handleInputChange}
          className="mt-1 p-2 border rounded-md w-full"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={editedData[name]}
          onChange={handleInputChange}
          className="mt-1 p-2 border rounded-md w-full"
        />
      )}
    </div>
  );

  const formatDateForInput = (dateString) => {
    const [dd, mm, yyyy] = dateString.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  const renderField = (label, name) => (
    <li key={label} className="mb-4">
      <strong className="block text-sm font-medium text-gray-700">
        {label}:
      </strong>
      <span className="mt-1 text-lg">
        {name === "password"
          ? "*".repeat(initialProfileData[name].length)
          : initialProfileData[name]}
      </span>
    </li>
  );

  const renderModalContent = () => (
    <Transition appear show={editable} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleEditClick}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-[90%] top-[6rem] absolute max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all z-50">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Edit Profile
                </Dialog.Title>
                <div className="space-y-4">
                  {renderEditableField("Given Name", "firstName")}
                  {renderEditableField("Surname", "lastName")}
                  {renderEditableField("Email", "email", "email")}
                  {renderEditableField("Phone Number", "phoneNumber", "tel")}
                  {renderEditableField("Location", "location")}
                  {renderEditableField("Date of Birth", "birthday", "date")}
                  {renderEditableField("Password", "password", "password")}
                </div>
                <div className="flex justify-end mt-4">
                <button
  type="button"
  onClick={handleSaveClick}
  className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-full text-med px-6 py-2 z-50"
>
  Save
</button>
<button
  type="button"
  onClick={handleEditClick}
  className="ml-4 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-med px-6 py-2 z-50"
>
  Cancel
</button>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  return (
    <div className="relative mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      <div className="flex justify-center col-start-1 col-span-1 lg:col-span-2 lg:row-span-1">
        <div className="mb-5 text-3xl "></div>
        <div
          className="border border-gray-500 w-[250px]"
          style={{ borderRadius: "20px" }}
        >
          <div className="grid justify-center mt-5">
            <div className="relative inline-block rounded-full object-cover object-center border border-black overflow-hidden">
              <Image src={DP} alt="DP" width={0} height={0} className="rounded-full object-cover h-52 w-52"/>
            </div>
          </div>
          <div className="flex justify-center mt-5 text-2xl font-semibold">
            {initialProfileData.firstName}{" "}
            {initialProfileData.lastName?.slice(0, 1)} ,{" "}
            {initialProfileData.age}
          </div>
          <div className="flex justify-center mt-3 mb-5 text-lg ">
            {initialProfileData.location}
          </div>
        </div>
      </div>
      <div className="grid justify-center lg:justify-start col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 lg:row-span-2 mt-5 lg:mt-0 lg:ml-10">
        <ul>
          {renderField("Given Name", "firstName")}
          {renderField("Surname", "lastName")}
          {renderField("Email", "email")}
          {renderField("Phone Number", "phoneNumber")}
          {renderField("Location", "location")}
          {renderField("Date of Birth", "birthday")}
          {renderField("Password", "password")}{" "}
        </ul>
        <div className="flex justify-center lg:justify-start my-7">
          {renderModalContent()}
          {!editable && (
            <button
            type="button"
            onClick={handleEditClick}
            className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Edit
          </button>
          )}
        </div>
      </div>
    </div>
  );
  };
  
  export default Profile;