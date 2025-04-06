"use client";
import Loading from "@/components/loading/Loading";
import { InfoSharedPanel } from "@/components/users/profile/InfoSharedPanel";
import { LocationPanel } from "@/components/users/profile/LocationPanel";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import x from "@/public/images/x.png";
import { updateUser } from "@/services/src/users/usersService";
import { Dialog, Transition } from "@headlessui/react";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, Fragment, useEffect, useState } from "react";

const calculateAge = (birthday: string) => {
  const [day, month, year] = birthday.split("-");
  const birthDate = new Date(`${year}-${month}-${day}`);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age.toString();
};

const Profile = () => {
  const router = useRouter();

  const { user, setUser } = useUser();

  const [editable, setEditable] = useState(false);

  const today = new Date();

  const formatDateForInput = (dateString: string) => {
    const [dd, mm, yyyy] = dateString.split("-");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateForProfile = (dateString: string) => {
    const [yyyy, mm, dd] = dateString.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

  const [editedData, setEditedData] = useState<UserData>(EmptyUserData);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.userId !== "") {
      window.scrollTo(0, 0);
      setEditedData(user);
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = changeEvent.target;
    if (name === "dob") {
      setEditedData((prevData) => ({
        ...prevData,
        dob: value == "" ? "Not Provided" : formatDateForProfile(value),
        age: value == "" ? "" : calculateAge(formatDateForProfile(value)),
      }));
    } else {
      setEditedData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSelectChange = (changeEvent: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = changeEvent.target;
    setEditedData((prevData) => ({ ...prevData, [name]: value }));
  };

  // useEffect(() => {
  //   if (isProfilePictureUpdated) {
  //     try {
  //       updateUser(initialProfileData.userId, editedData);
  //     } catch {
  //       router.push("/error");
  //     }
  //     setInitialProfileData({ ...editedData });
  //     setIsProfilePictureUpdated(false);
  //   }
  // }, [isProfilePictureUpdated, editedData, initialProfileData]);

  const handleInputChangeMobile = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    setEditedData({
      ...editedData,
      contactInformation: {
        email: editedData.contactInformation!.email,
        mobile: changeEvent.target.value,
      },
    });
  };

  const handleEditClick = () => {
    setEditable(!editable);
    setEditedData({ ...user });
  };

  const handleSaveClick = () => {
    if (editedData.firstName.trim() === "") {
      return;
    }

    console.log("Saving changes:", editedData);
    setEditable(false);
    try {
      updateUser(editedData.userId, editedData);
    } catch {
      router.push("/error");
    }
  };

  const renderEditableField = (label: string, name: keyof UserData) => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
        {label} {label === "Given Name" && <span className="text-red-500">*</span>}
      </label>
      {label === "Date of Birth" ? (
        <input
          type="date"
          name={name as string}
          value={
            editable
              ? formatDateForInput(editedData[name] as string)
              : formatDateForInput(editedData[name] as string)
          }
          onChange={handleInputChange}
          max={today.toISOString().split("T")[0]}
          className="mt-1 p-2 border rounded-md w-full"
        />
      ) : label === "Gender" ? (
        <select
          name={name as string}
          value={editable ? (editedData[name] as string) : (editedData[name] as string)}
          onChange={handleSelectChange}
          className="mt-1 p-2 border rounded-md w-full"
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      ) : (
        <input
          type="text"
          name={name as string}
          value={editable ? (editedData[name] as string) : (editedData[name] as string)}
          onChange={handleInputChange}
          className="mt-1 p-2 border rounded-md w-full"
          placeholder="Not Provided"
        />
      )}
    </div>
  );

  const renderEditableFieldMobile = (label: string, name: "mobile") => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        pattern="[0-9]*"
        name={`contactInformation.${name}`}
        value={
          editable
            ? (editedData.contactInformation?.[name] as string)
            : (editedData.contactInformation?.[name] as string)
        }
        onChange={handleInputChangeMobile}
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
        placeholder="Not Provided"
      />
    </div>
  );

  const renderField = (label: string, name: string) => (
    <div key={label} className="mb-4">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700">{label}:</strong>
        <span
          className={`text-md md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700 ${
            name === "email" ? "break-all" : ""
          }`}
        >
          {(editedData[name as keyof UserData] as string) === ""
            ? "Not Provided"
            : (editedData[name as keyof UserData] as string)}
        </span>
      </div>
    </div>
  );

  const renderFieldContact = (label: string, name: "mobile" | "email") => (
    <div key={label} className="mb-4">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700">{label}:</strong>
        <span
          className={`text-md md:text-md lg:text-lg 3xl:text-xl font-medium text-gray-700 ${
            name === "email" ? "break-all" : ""
          }`}
        >
          {(editedData.contactInformation?.[name] as string) === ""
            ? "Not Provided"
            : (editedData.contactInformation?.[name] as string)}
        </span>
      </div>
    </div>
  );

  // const renderModalContent = () => (
  //   <Transition appear show={editable} as={Fragment}>
  //     <Dialog as="div" className="relative z-10" onClose={handleEditClick}>
  //       <Transition.Child
  //         as={Fragment}
  //         enter="ease-out duration-300"
  //         enterFrom="opacity-0"
  //         enterTo="opacity-100"
  //         leave="ease-in duration-200"
  //         leaveFrom="opacity-100"
  //         leaveTo="opacity-0"
  //       >
  //         <div className="fixed inset-0 bg-black/25" />
  //       </Transition.Child>
  //       <div className="fixed inset-0 overflow-y-auto">
  //         <div className="flex min-h-full items-center justify-center p-4 text-center">
  //           <Transition.Child
  //             as={Fragment}
  //             enter="ease-out duration-300"
  //             enterFrom="opacity-0 scale-95"
  //             enterTo="opacity-100 scale-100"
  //             leave="ease-in duration-200"
  //             leaveFrom="opacity-100 scale-100"
  //             leaveTo="opacity-0 scale-95"
  //           >
  //             <Dialog.Panel className="w-[90%] top-[6rem] absolute max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all z-50">
  //               <div className="flex justify-between mb-3">
  //                 <Dialog.Title
  //                   as="h3"
  //                   className="text-xl lg:text-2xl 3xl:text-2xl font-medium leading-6 text-gray-900 mb-3"
  //                 >
  //                   Edit Profile
  //                 </Dialog.Title>
  //                 <div className="flex justify-end ">
  //                   <button
  //                     type="button"
  //                     onClick={handleEditClick}
  //                     className="text-gray-500 hover:text-gray-700 focus:outline-none"
  //                   >
  //                     <Image src={x} alt="x" width={0} height={0} className="w-5 h-5 -mt-6" />
  //                   </button>
  //                 </div>
  //               </div>
  //               <div className="space-y-4 text-md lg:text-lg 3xl:text-xl -mt-1">
  //                 {renderEditableField("Given Name", "firstName")}
  //                 {renderEditableField("Surname", "surname")}
  //                 {renderEditableFieldMobile("Phone Number", "mobile")}
  //                 {renderEditableField("Gender", "gender")}
  //                 {renderEditableField("Date of Birth", "dob")}
  //                 {renderEditableField("Location", "location")}
  //               </div>
  //               <div className="flex justify-end mt-4">
  //                 <button
  //                   type="button"
  //                   onClick={handleSaveClick}
  //                   className="text-white bg-black font-medium rounded-full text-med px-6 py-2 z-50"
  //                 >
  //                   Save
  //                 </button>
  //               </div>
  //             </Dialog.Panel>
  //           </Transition.Child>
  //         </div>
  //       </div>
  //     </Dialog>
  //   </Transition>
  // );

  return loading ? (
    <Loading />
  ) : (
    <div className="w-screen flex justify-center">
      <div className="screen-width-primary">
        <div className="mt-16 block lg:flex lg:space-x-10">
          <div className="basis-2/5 space-y-6">
            <div className="flex mt-8 mb-4 font-bold text-2xl md:text-3xl lg:text-4xl 3xl:text-5xl">
              {user.firstName}&apos;s Profile
              {user.isVerifiedOrganiser && (
                <div>
                  <Image src={Tick} alt="Verified Organiser" className="h-10 w-10 ml-2" />
                  <div className="absolute transform translate-x-12 -translate-y-8 ml-2 bg-[#f2b705] text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                    Verified Organiser
                  </div>
                </div>
              )}
            </div>

            <ProfilePhotoPanel user={user} setUser={setUser} setEditedData={setEditedData} />
            <InfoSharedPanel />
            <LocationPanel />
            <p className="text-xs font-light mt-2 ml-1">
              (If your edit profile picture isn&apos;t working, try closing and reopening or changing the browser.)
            </p>
          </div>

          <div className="basis-3/5 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg">
            <div
              className="mb-2 text-xl lg:text-2xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "2px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Name</div>
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
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Contact Info</div>
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
            </div>
            <ul className="w-full">
              {renderField("Gender", "gender")}
              {renderField("Date of Birth", "dob")}
              {renderField("Location", "location")}
            </ul>
            <div className="flex justify-start my-6 3xl:my-8">
              {/* {renderModalContent()} */}
              <button
                type="button"
                onClick={handleEditClick}
                className="text-white bg-black font-medium rounded-full text-med px-6 py-2"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
