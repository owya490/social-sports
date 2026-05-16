"use client";
import Loading from "@/components/loading/Loading";
import { ProfileEditableDetails } from "@/components/users/profile/ProfileEditableDetails";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { EmailChangeModal } from "@/components/users/profile/EmailChangeModal";
import { useUser } from "@/components/utility/UserContext";
import { updateUser } from "@/services/src/users/usersService";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import { Switch } from "@mantine/core";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useEffect, useState } from "react";

// const calculateAge = (birthday: string) => {
//   const [day, month, year] = birthday.split("-");
//   const birthDate = new Date(`${year}-${month}-${day}`);
//   const currentDate = new Date();
//   let age = currentDate.getFullYear() - birthDate.getFullYear();
//   if (
//     currentDate.getMonth() < birthDate.getMonth() ||
//     (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())
//   ) {
//     age--;
//   }
//   return age.toString();
// };

const Profile = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [emailChangeModalOpened, setEmailChangeModalOpened] = useState(false);

  useEffect(() => {
    if (user.userId !== "") {
      window.scrollTo(0, 0);
      setLoading(false);
    }
  }, [user]);

  const handleUserProfileUpdate = async (field: string, value: any): Promise<boolean> => {
    // Need to update remote data respective to public/ private
    await updateUser(user.userId, { [field]: value });
    // Need to update local user data
    setUser({
      ...user,
      [field]: value,
    });
    // Bust the cache to ensure the updated data is fetched next time
    bustUserLocalStorageCache();
    return true;
  };

  return loading ? (
    <Loading />
  ) : (
    <div className="w-screen flex justify-center mb-10 px-1">
      <div className="screen-width-primary">
        <div className="mt-6 mb-10 block lg:flex lg:space-x-10">
          <div className="basis-2/5 space-y-6">
            <div className="flex mb-4 font-bold text-2xl">
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

            <ProfilePhotoPanel user={user} setUser={setUser} />
            {/* <InfoSharedPanel /> */}
            {/* <LocationPanel /> */}
            <p className="text-xs font-light mt-2 ml-1">
              (If your edit profile picture isn&apos;t working, try closing and reopening or changing the browser.)
            </p>
            <div>
              <h2 className="mb-1 md:mb-2 lg:mt-1 text-xl">Profile Settings</h2>
              <div className="h-[1px] bg-[#ccc] mb-2"></div>
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
                    handleUserProfileUpdate("isSearchable", event.currentTarget.checked);
                  }}
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setEmailChangeModalOpened(true)}
                  className="bg-black px-3 py-1.5 text-white rounded-lg"
                  type="button"
                >
                  Change Email
                </button>
              </div>
            </div>
          </div>

          <div className="basis-3/5 mt-6 md:mt-16 3xl:mt-20 3xl:text-lg">
            <ProfileEditableDetails user={user} setUser={setUser} />
          </div>
        </div>
      </div>

      <EmailChangeModal
        isOpen={emailChangeModalOpened}
        onClose={() => setEmailChangeModalOpened(false)}
        currentEmail={user.contactInformation.email}
      />
    </div>
  );
};

export default Profile;
