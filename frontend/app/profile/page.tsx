"use client";
import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";
import React, { useState, useEffect } from "react";

const loggedin = true;
const firstName = "Owen";
const lastName = "Yang";
const truncatedLastName = lastName ? lastName.slice(0, 1) : "";
const location = "Sydney, Australia";
const phoneNumber = "0468368618";
const email = "owya490@gmail.com";
const birthday = "23/07/2002";
const age = 21;
const password = "danielinthesky";


const Profile = () => {
  const [editable, setEditable] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName,
    lastName,
    location,
    phoneNumber,
    email,
    birthday,
    password,
  });

  const handleEditClick = () => {
    setEditable(!editable);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSaveClick = () => {
    // Implement functionality
    setEditable(false);
  };

  const renderField = (label, value, name, type = "text") => {
    if (editable) {
      return (
        <li key={name}>
          <strong>{label}:</strong>{" "}
          <input
            type={type}
            name={name}
            value={editedData[name]}
            onChange={handleInputChange}
          />
        </li>
      );
    } else {
      return (
        <li key={name}>
          <strong>{label}:</strong> {value}
        </li>
      );
    }
  };

  return (
    <div className="mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      <div
        className="col-start-1 col-span-1 lg:col-span-2 border border-gray-500 w-[250px]"
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
          {firstName} {truncatedLastName} , {age}
        </div>
        <div className="flex justify-center mt-3 mb-5 text-lg ">{location}</div>
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 mt-5 lg:mt-0">
        <div className="flex justify-center lg:justify-start text-3xl lg:text-4xl font-semibold lg:my-3">
          Profile Details
        </div>
        <div className="flex justify-center lg:justify-start text-lg mt-5">
          <ul>
            {renderField("Given Name", firstName, "firstName")}
            {renderField("Surname", lastName, "lastName")}
            {renderField("Email", email, "email", "email")}
            {renderField("Phone Number", phoneNumber, "phoneNumber", "tel")}
            {renderField("Location", location, "location")}
            {renderField("Date of Birth", birthday, "birthday", "date")}
            {renderField("Password", password, "password", "password")}
          </ul>
        </div>
        <div className="flex justify-center lg:justify-start my-7">
          {editable ? (
            <>
              <button
                type="button"
                onClick={handleSaveClick}
                className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-full text-med px-6 py-2 text-center"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="ml-4 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-med px-6 py-2 text-center"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
