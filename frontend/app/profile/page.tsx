// Import necessary modules and components
"use client";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import React, { Fragment, useState } from "react";
import DP from "./../../public/images/Ashley & Owen.png";

// Define initial profile data
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

// Define the Profile component
const Profile = () => {
  // State variables to manage the edit mode and edited data
  const [editable, setEditable] = useState(false);
  const [editedData, setEditedData] = useState({ ...initialProfileData });

  // Event handler for the "Edit" button click
  const handleEditClick = () => {
    if (editable) {
      // Reset editedData to initialProfileData when cancelling edits
      setEditedData({ ...initialProfileData });
    }
    setEditable(!editable);
  };

  // Event handler for input changes in the modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Special handling for "Date of Birth" field
    if (name === "birthday") {
      setEditedData((prevData) => ({
        ...prevData,
        birthday: value, // Update the date value directly
      }));
    } else {
      setEditedData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  // Event handler for the "Save" button click
  const handleSaveClick = () => {
    // Implement functionality to save changes
    console.log("Saving changes:", editedData);
    setEditable(false);
  };

  // Render each editable field in the modal
  const renderEditableField = (label, name, type = "text") => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {type === "date" ? (
        <input
          type={type}
          name={name}
          value={formatDateForInput(editedData[name])} // Use the editedData value for prefilling
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

  // Helper function to format date for input (dd-mm-yyyy)
  const formatDateForInput = (dateString) => {
    const [dd, mm, yyyy] = dateString.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Render each non-editable field using the initialProfileData
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

  // Modal content using Headless UI Dialog
  const renderModalContent = () => (
    <Transition.Root show={editable} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-y-auto"
        onClose={handleEditClick}
      >
        <div className="flex items-center justify-center min-h-full">
          <Dialog.Overlay className="fixed inset-0 bg-black/25" />

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h2" className="text-2xl font-semibold mb-4">
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
                  className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-full text-med px-6 py-2"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="ml-4 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-med px-6 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );

  return (
    <div className="relative mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      <div
        className="col-start-1 col-span-1 lg:col-span-2 lg:row-span-1 border border-gray-500 w-[250px]"
        style={{ borderRadius: "20px" }}
      >
        <div className="grid justify-center mt-5">
          <Image
            src={DP}
            alt="DP"
            width={160}
            height={160}
            className="relative inline-block h-150 w-150 rounded-full object-cover object-center border border-black overflow-hidden"
          />
        </div>
        <div className="flex justify-center mt-5 text-2xl font-semibold">
          {initialProfileData.firstName}{" "}
          {initialProfileData.lastName?.slice(0, 1)} , {initialProfileData.age}
        </div>
        <div className="flex justify-center mt-3 mb-5 text-lg ">
          {initialProfileData.location}
        </div>
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 lg:row-span-2 mt-5 lg:mt-0">
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
