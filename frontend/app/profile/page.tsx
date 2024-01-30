"use client";
import { useUser } from "@/components/utility/UserContext";
import { UserData } from "@/interfaces/UserTypes";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import eye from "./../../public/images/Eye.png";
import location from "./../../public/images/location.png";
import Upload from "./../../public/images/upload.png";
import x from "./../../public/images/x.png";

const calculateAge = (birthday: string) => {
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
  return age.toString();
};

const Profile = () => {
  const [editable, setEditable] = useState(false);

  const { user: contextUser, setUser: setContextUser } = useUser();

  const formatDateForInput = (dateString: string) => {
    const [dd, mm, yyyy] = dateString.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateForProfile = (dateString: string) => {
    const [yyyy, mm, dd] = dateString.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

  const [initialProfileData, setInitialProfileData] = useState<UserData>({
    firstName: "Aidan",
    surname: "Chee",
    location: "Syd",
    contactInformation: {
      mobile: "0468368618",
      email: "aidan@gmail.com",
    },
    profilePicture:
      contextUser?.profilePicture ||
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
    dob: "17-01-2002", // DD-MM-YYYY format
    age: calculateAge("17-01-2002"), // Calculate initial age
    gender: "Female",
    userId: "",

    // firstName: contextUser?.firstName || "",
    // surname: contextUser?.surname || "",
    // location: contextUser?.location || "",
    // contactInformation: {
    //   mobile: contextUser?.contactInformation?.mobile || "",
    //   email: contextUser?.contactInformation?.email || "",
    // },
    // profilePicture:
    //   contextUser?.profilePicture ||
    //   "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c",
    // dob: contextUser?.dob || "", // DD-MM-YYYY format
    // age: calculateAge(contextUser?.dob || ""), // Calculate initial age
    // gender: contextUser?.gender || "",
    // userId: "",
  });

  useEffect(() => {
    console.log(initialProfileData);
  }, [initialProfileData]);

  const handleInputChange = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = changeEvent.target;
    if (name === "dob") {
      setEditedData((prevData) => ({
        ...prevData,
        dob: formatDateForProfile(value),
        age: calculateAge(formatDateForProfile(value)),
      }));
    } else {
      setEditedData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSelectChange = (changeEvent: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = changeEvent.target;
    setEditedData((prevData) => ({ ...prevData, [name]: value }));
  };

  // const handleFileInputChange =

  const handleInputChangeContact = (
    changeEvent: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = changeEvent.target;
    const [parentKey, childKey] = name.split(".");
    setEditedData((prevData) => ({
      ...prevData,
      [parentKey]: {
        ...prevData[parentKey],
        [childKey]: value,
      },
    }));
  };

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleEditClick = () => {
    if (editable) {
      setEditedData({ ...initialProfileData });
    }
    setEditable(!editable);
  };

  const [editedData, setEditedData] = useState<UserData>({
    ...initialProfileData,
  });

  const handleSaveClick = () => {
    console.log("Saving changes:", editedData);
    setEditable(false);

    setInitialProfileData({ ...editedData });
  };

  const renderEditableField = (
    label: string,
    name: keyof UserData,
    type = "text"
  ) => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {label === "Date of Birth" ? (
        <input
          type="date"
          name={name as string}
          value={
            editable
              ? formatDateForInput(editedData[name] as string)
              : formatDateForInput(initialProfileData[name] as string)
          }
          onChange={handleInputChange}
          className="mt-1 p-2 border rounded-md w-full"
        />
      ) : label === "Gender" ? (
        <select
          name={name as string}
          value={
            editable
              ? (editedData[name] as string)
              : (initialProfileData[name] as string)
          }
          onChange={handleSelectChange}
          className="mt-1 p-2 border rounded-md w-full"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      ) : (
        <input
          type="text"
          name={name as string}
          value={
            editable
              ? (editedData[name] as string)
              : (initialProfileData[name] as string)
          }
          onChange={handleInputChange}
          className="mt-1 p-2 border rounded-md w-full"
        />
      )}
    </div>
  );

  const renderEditableFieldMobile = (
    label: string,
    name: "mobile",
    type = "text"
  ) => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        pattern="[0-9]*"
        name={`contactInformation.${name}`}
        value={
          editable
            ? (editedData.contactInformation?.[name] as string)
            : (initialProfileData.contactInformation?.[name] as string)
        }
        onChange={handleInputChangeContact}
        onKeyDown={(e) => {
          const key = e.key;
          if (key === "Backspace" || key === "Delete") {
            return;
          }
          if (!/[0-9]/.test(key)) {
            e.preventDefault();
          }
        }}
        inputMode="tel"
        className="mt-1 p-2 border rounded-md w-full"
      />
    </div>
  );

  const renderField = (label: string, name: string) => (
    <div key={label} className="mb-4">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700">
          {label}:
        </strong>
        <span
          className={`text-md md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700 ${
            name === "email" ? "break-all" : ""
          }`}
        >
          {name === "password"
            ? "********"
            : (initialProfileData[name as keyof UserData] as string)}
        </span>
      </div>
    </div>
  );

  const renderFieldContact = (label: string, name: "mobile" | "email") => (
    <div key={label} className="mb-4">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700">
          {label}:
        </strong>
        <span
          className={`text-md md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700 ${
            name === "email" ? "break-all" : ""
          }`}
        >
          {initialProfileData.contactInformation?.[name]}
        </span>
      </div>
    </div>
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
                <div className="flex justify-between mb-3">
                  <Dialog.Title
                    as="h3"
                    className="text-xl lg:text-2xl 3xl:text-2xl font-medium leading-6 text-gray-900 mb-3"
                  >
                    Edit Profile
                  </Dialog.Title>
                  <div className="flex justify-end ">
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <Image
                        src={x}
                        alt="x"
                        width={0}
                        height={0}
                        className="w-5 h-5 -mt-6"
                      />
                    </button>
                  </div>
                </div>
                <div className="space-y-4 text-md lg:text-lg 3xl:text-xl -mt-1">
                  {renderEditableField("Given Name", "firstName")}
                  {renderEditableField("Surname", "surname")}
                  {/* {renderEditableFieldContact("Email", "email")} */}
                  {renderEditableFieldMobile("Phone Number", "mobile")}
                  {renderEditableField("Gender", "gender")}
                  {renderEditableField("Date of Birth", "dob")}
                  {renderEditableField("Location", "location")}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className="text-white bg-black font-medium rounded-full text-med px-6 py-2 z-50"
                  >
                    Save
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
    <div className="w-screen flex justify-center">
      <div className="w-screen mx-10 sm:mx-0 sm:w-[400px] md:w-[700px] lg:w-[1000px] xl:w-[1000px] 3xl:w-[1400px]">
        <div className="relative mt-[92px] lg:mt-[120px] mb-[5%] grid grid-cols-1 md:grid-cols-2 md:gap-x-[5vw] lg:gap-x-[4vw]">
          <div className="flex justify-center md:justify-start col-start-1 col-span-1 md:col-start-2 md:row-span-1 md:row-start-1">
            <div
              className="flex justify-center mb-4 text-2xl md:text-3xl lg:text-4xl 3xl:text-5xl"
              style={{ fontWeight: 600 }}
            >
              {initialProfileData.firstName}&apos;s Profile
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-center w-full h-fit col-start-1 col-span-1 md:row-start-1">
              <div
                className="lg:flex-row border border-gray-500 lg:h-60 w-full 3xl:h-72 lg:flex lg:items-center justify-center md:p-2"
                style={{ borderRadius: "20px" }}
              >
                <div className="relative mx-5 md:mx-3 mt-4 lg:mt-0">
                  <div
                    className="flex justify-center transition duration-500 rounded-full relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="relative h-52 w-52 3xl:h-64 3xl:w-64 rounded-full overflow-hidden">
                      <Image
                        src={initialProfileData.profilePicture}
                        alt="DP"
                        width={0}
                        height={0}
                        className="object-cover h-full w-full"
                        onClick={() => {
                          document.getElementById("Image_input")!.click();
                        }}
                      />
                      <div className="absolute bottom-0 inset-x-0">
                        <div className="flex items-center justify-center bg-black bg-opacity-50 text-white text-lg font-semibold py-2">
                          Edit
                        </div>
                      </div>
                    </div>
                    {isHovered && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <input
                          type="file"
                          id="Image_input"
                          className="hidden"
                          // onChange={handleFileInputChange}
                          accept=".jpg,.jpeg,.png"
                        />
                        <Image
                          src={Upload}
                          alt="Upload"
                          width={0}
                          height={0}
                          className="rounded-full object-cover h-52 w-52 3xl:h-64 3xl:w-64 opacity-60"
                          onClick={() => {
                            document.getElementById("Image_input")!.click();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center lg:ml-3">
                  <div className="flex justify-center lg:justify-start mt-5 3xl:mt-9 text-xl 3xl:text-3xl font-semibold">
                    <span className="lg:whitespace-no-wrap">
                      {initialProfileData.firstName}{" "}
                      {initialProfileData.surname?.slice(0, 1)}, {""}
                      {initialProfileData.age}
                    </span>
                  </div>
                  <div className="flex justify-center mt-3 3xl:mt-5 mb-5 text-lg 3xl:text-xl">
                    {initialProfileData.location}
                  </div>
                </div>
              </div>
            </div>
            <div className="justify-end col-start-1 col-span-1 lg:row-span-1 lg:row-start-2 hidden lg:block mb-6 mt-6">
              <div
                className="border border-gray-500 h-fit"
                style={{ borderRadius: "20px" }}
              >
                <div className="ml-6 mt-3">
                  <Image
                    src={eye}
                    alt="eye"
                    width={0}
                    height={0}
                    className="h-9 w-12"
                  />
                </div>
                <div
                  className="text-xl 3xl:text-2xl text-bold ml-4 mr-3 my-2 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4"
                  style={{ fontWeight: "bold" }}
                >
                  What info is shared with others?
                </div>
                <div className="text-md 3xl:text-lg ml-4 mr-3 my-3 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4">
                  Sports Hub only releases your name and contact information to
                  the host of the event you are attending.
                </div>
              </div>
            </div>
            <div className="justify-end col-start-1 col-span-1 lg:row-span-1 lg:row-start-3 hidden lg:block mb-6 ">
              <div
                className="border border-gray-500 h-fit"
                style={{ borderRadius: "20px" }}
              >
                <div className="ml-7 mt-3">
                  <Image
                    src={location}
                    alt="location"
                    width={0}
                    height={0}
                    className="h-9 w-9"
                  />
                </div>
                <div
                  className="text-xl 3xl:text-2xl text-bold ml-4 mr-3 my-2 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4"
                  style={{ fontWeight: "bold" }}
                >
                  What is my location used for?
                </div>
                <div className="text-md 3xl:text-lg ml-4 mr-3 my-3 lg:mr-5 lg:ml-6 3xl:mr-6 3xl:ml-7 3xl:my-4">
                  Sports Hub uses your location to better recommend you events
                  that are close to you!
                </div>
              </div>
            </div>
          </div>
          <div className="col-start-1 col-span-1 md:col-start-2 md:row-start-1 md:row-span-4 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg">
            <div
              className="mb-2 text-xl lg:text-2xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "2px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Name</div>
              {/* <div
                className="flex justify-end text-sm lg:text-md"
                onClick={handleEditClick}
              >
                {renderModalContent()}
                <u>Edit</u>
              </div> */}
            </div>
            <ul className="w-full">
              {renderField("Given Name", "firstName")}
              {renderField("Surname", "surname")}
            </ul>

            <div
              className="mb-2 text-xl lg:text-2xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "2px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">
                Contact Info
              </div>
              {/* <div
                className="flex justify-end text-sm lg:text-md"
                onClick={handleEditClick}
              >
                {renderModalContent()}
                <u>Edit</u>
              </div> */}
            </div>
            <ul className="w-full">
              {renderFieldContact("Email", "email")}
              {renderFieldContact("Phone Number", "mobile")}
            </ul>

            <div
              className="mb-2 text-xl lg:text-2xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "2px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">About Me</div>
              {/* <div
                className="flex justify-end text-sm lg:text-md"
                onClick={handleEditClick}
              >
                {renderModalContent()}
                <u>Edit</u>
              </div> */}
            </div>
            <ul className="w-full">
              {renderField("Gender", "gender")}
              {renderField("Date of Birth", "dob")}
              {renderField("Location", "location")}
            </ul>
            {/* <div
              className="mb-2 text-xl lg:text-2xl"
              style={{
                fontWeight: 400,
                borderBottom: "2px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 mt-6 md:mt-4 lg:mt-8">Security</div>
            </div>
            <ul className="w-full">{renderField("Password", "password")}</ul> */}
            {/* <div className="flex justify-start my-6 3xl:my-8">
              {renderModalContent()}
              <button
                type="button"
                onClick={handleEditClick}
                className="text-white bg-black font-medium rounded-full text-med px-6 py-2"
              >
                Edit
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
