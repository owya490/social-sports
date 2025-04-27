"use client";
import Loading from "@/components/loading/Loading";
import { FieldTypes, RenderEditableField, RenderNonEditableField } from "@/components/users/profile/ProfileFields";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import { updateUser } from "@/services/src/users/usersService";
import { Switch } from "@mantine/core";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";

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

  return loading ? (
    <Loading />
  ) : (
    <div className="w-screen flex justify-center mb-10 px-1">
      <div className="screen-width-primary">
        <div className="mt-16 block lg:flex lg:space-x-10">
          <div className="basis-2/5 space-y-6">
            <div className="flex mt-8 mb-4 font-bold text-2xl">
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
            {/* <InfoSharedPanel /> */}
            {/* <LocationPanel /> */}
            <p className="text-xs font-light mt-2 ml-1">
              (If your edit profile picture isn&apos;t working, try closing and reopening or changing the browser.)
            </p>
            <div>
              <div
                className="mb-2 text-xl flex justify-between items-center"
                style={{
                  fontWeight: 400,
                  borderBottom: "1px solid #ccc",
                  width: "100%",
                }}
              >
                <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Profile Settings</div>
              </div>

              <div className="flex justify-between w-full mb-2">
                <strong className="text-xs md:text-md font-medium text-gray-700">
                  Allow profile to be publically searchable?:
                </strong>
                <Switch
                  color="teal"
                  size="sm"
                  className="ml-auto"
                  checked={user.isSearchable}
                  onChange={(event) => {
                    setUser({
                      ...user,
                      isSearchable: event.currentTarget.checked,
                    });
                    updateUser(user.userId, {
                      isSearchable: event.currentTarget.checked,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="basis-3/5 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg">
            <div
              className="mb-2 text-xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "1px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Personal Details</div>
            </div>
            <ul className="w-full">
              <RenderEditableField
                label="First Name"
                value={user.firstName}
                type={FieldTypes.SHORT_TEXT}
                onSubmit={(value) => {
                  // Need to update local user data
                  setUser({
                    ...user,
                    firstName: value,
                  });
                  // Need to update remote data respective to public/ private
                  updateUser(user.userId, { firstName: value });
                }}
              />
              <RenderEditableField label="Last Name" value={user.surname} type={FieldTypes.SHORT_TEXT} />
              <RenderEditableField label="Location" value={user.location} type={FieldTypes.SHORT_TEXT} />
              <RenderEditableField label="Date of Birth" value={user.dob} type={FieldTypes.DATE} />
              <RenderEditableField
                label="Gender"
                value={user.gender}
                type={FieldTypes.SELECT}
                options={["Male", "Female"]}
              />
            </ul>

            <div
              className="mt-4 mb-2 text-xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "1px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Public Info</div>
            </div>
            <ul className="w-full">
              <RenderEditableField
                label="Contact Email"
                value={user.publicContactInformation.email}
                type={FieldTypes.SHORT_TEXT}
              />
              <RenderEditableField
                label="Phone Number"
                value={user.publicContactInformation.mobile}
                type={FieldTypes.SHORT_TEXT}
                customValidation={(input) => /^\d*$/.test(input)} // Only allow numbers and empty string, no decimal or commas
              />
              <RenderEditableField label="Bio" value={user.bio} type={FieldTypes.LONG_TEXT} />
            </ul>

            <div
              className="mt-4 mb-2 text-xl flex justify-between items-center"
              style={{
                fontWeight: 400,
                borderBottom: "1px solid #ccc",
                width: "100%",
              }}
            >
              <div className="mb-1 md:mb-2 lg:mt-1 justify-start">Private Info</div>
            </div>
            <ul className="w-full">
              <RenderNonEditableField label="User ID" value={user.userId} />
              <RenderEditableField label="Username" value={user.username} type={FieldTypes.SHORT_TEXT} />
              <RenderEditableField
                label="Private Email"
                value={user.contactInformation.email}
                type={FieldTypes.SHORT_TEXT}
              />
              <RenderEditableField
                label="Private Phone Number"
                value={user.contactInformation.mobile}
                type={FieldTypes.SHORT_TEXT}
                customValidation={(input) => /^\d*$/.test(input)} // Only allow numbers and empty string, no decimal or commas
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
