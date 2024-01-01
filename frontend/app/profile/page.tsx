"use client";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { Fragment, useState } from "react";
import DP from "./../../public/images/Ashley & Owen.png";
import eye from "./../../public/images/Eye.png";

const calculateAge = (birthday) => {
  const [day, month, year] = birthday.split("-");
  const birthDate = new Date(`${year}-${month}-${day}`);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();

  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() &&
      currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const initialProfileData = {
  firstName: "Owenoo",
  lastName: "Yang",
  location: "Sydney, Australia",
  phoneNumber: "0468368618",
  email: "owya490@gmail.com",
  birthday: "23-07-2002", // DD-MM-YYYY format
  age: calculateAge("23-07-2002"), // Calculate initial age
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
      <strong className="block text-md lg:text-lg 3xl:text-xl font-medium text-gray-700">
        {label}:
      </strong>
      <span className="mt-1 text-lg lg:text-xl 3xl:text-2xl">
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
                  className="text-xl lg:text-2xl 3xl:text-2xl font-medium leading-6 text-gray-900 mb-3"
                >
                  Edit Profile
                </Dialog.Title>
                <div className="space-y-4 text-md lg:text-lg 3xl:text-xl">
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

  const editedAge = calculateAge(editedData.birthday);

  return (
    <div className="relative mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-8 lg:gap-x-[2vw] lg:px-10">
      <div className="flex justify-center lg:justify-start col-start-1 col-span-1 lg:col-start-5 lg:col-span-4 lg:row-span-1 lg:row-start-1">
        <div
          className="flex justify-center mb-5 lg:mb-8 3xl:mb-9 text-3xl lg:text-5xl 3xl:text-5xl"
          style={{ fontWeight: 500 }}
        >
          {initialProfileData.firstName}'s Profile
        </div>
      </div>
      <div className="flex justify-center w-full lg:justify-end col-start-1 col-span-1 lg:col-span-4 lg:row-span-2 lg:row-start-1 mr-10">
        <div
          className=" lg:items-start lg:flex-row border border-gray-500 w-[250px] lg:h-[250px] w-[auto] 3xl:h-[310px] lg:flex lg:items-center lg:p-4"
          style={{ borderRadius: "20px" }}
        >
          <div className="justify-center mx-5 lg:mx-3 mt-4 lg:mt-0">
            <Image
              src={DP}
              alt="DP"
              width={0}
              height={0}
              className="rounded-full object-cover h-52 w-52 3xl:h-64 3xl:w-64"
            />
          </div>
          <div className="flex flex-col justify-center lg:ml-3">
            <div className="flex justify-center lg:justify-start mt-5 2xl:mt-7 3xl:mt-9 text-2xl 3xl:text-4xl font-semibold">
              <span className="lg:whitespace-no-wrap">
                {initialProfileData.firstName}{" "}
                {initialProfileData.lastName?.slice(0, 1)}, {""}
                {initialProfileData.age}
              </span>
            </div>
            <div className="flex justify-center mt-3 3xl:mt-5 mb-5 text-xl 3xl:text-2xl">
              {initialProfileData.location}
            </div>
          </div>
        </div>
      </div>
      <div className="grid justify-center lg:justify-start col-start-1 col-span-1 lg:col-start-5 lg:col-span-4 lg:row-start-2 lg:row-span-3 mt-5 lg:mt-0 3xl:text-xl">
        <div
          className="mb-5 2xl:mb-7 3xl:mb-9 text-3xl lg:text-4xl 3xl:text-5xl"
          style={{ fontWeight: 400 }}
        >
          Name
        </div>
        <ul>
          {renderField("Given Name", "firstName")}
          {renderField("Surname", "lastName")}
        </ul>
        <div
          className="mb-5 2xl:mb-7 3xl:mb-9 text-3xl lg:text-4xl 3xl:text-5xl"
          style={{ fontWeight: 400 }}
        >
          Contact Info
        </div>
        <ul>
          {renderField("Email", "email")}
          {renderField("Phone Number", "phoneNumber")}
        </ul>
        <div
          className="mb-5 2xl:mb-7 3xl:mb-9 text-3xl lg:text-4xl 3xl:text-5xl"
          style={{ fontWeight: 400 }}
        >
          About Me
        </div>
        <ul>
          {renderField("Location", "location")}
          {renderField("Date of Birth", "birthday")}
          {renderField("Password", "password")}{" "}
        </ul>
        <div className="flex justify-center lg:justify-start my-2 3xl:my-4">
          {renderModalContent()}
          {!editable && (
            <button
              type="button"
              onClick={handleEditClick}
              className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 3xl:px-8 3xl:py-3 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {/* <div className="lg:flex justify-center lg:justify-end 3xl:justify-center col-start-1 col-span-1 lg:col-span-2 2xl:col-span-3 3xl:col-span-2 lg:col-start-4 lg:row-span-2 lg:row-start-1 2xl:col-start-5 3xl:col-start-5 hidden lg:block">
        <div
          className="border border-gray-500 w-[250px] lg:w-[280px] 2xl:w-[400px] 3xl:w-[440px] h-fit lg:mr-5 2xl:mr-10 mt-4 lg:mt-0"
          style={{ borderRadius: "20px" }}
        >
          <div className="ml-4 lg:ml-6 2xl:ml-7 mt-3">
            <Image
              src={eye}
              alt="eye"
              width={0}
              height={0}
              className="h-9 w-12"
            />
          </div>
          <div
            className="text-2xl 3xl:text-3xl text-bold ml-4 mr-3 my-2 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4"
            style={{ fontWeight: "bold" }}
          >
            What info is shared with others?
          </div>
          <div className="text-lg 3xl:text-xl ml-4 mr-3 my-3 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4">
            Sports Hub only releases contact information to the host of the
            event you are attending.
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Profile;
