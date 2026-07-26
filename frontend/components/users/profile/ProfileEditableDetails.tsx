"use client";

import { FieldTypes, RenderEditableField, RenderNonEditableField } from "@/components/users/profile/ProfileFields";
import { UserData } from "@/interfaces/UserTypes";
import { updateUser } from "@/services/src/users/usersService";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import { updateUsername } from "@/services/src/users/usersUtils/usernameUtils";
import { Dispatch, SetStateAction, useState } from "react";

export type ProfileEditableDetailsProps = {
  user: UserData;
  setUser: Dispatch<SetStateAction<UserData>>;
  /** Omit User ID and private email rows (organiser onboarding basics step). */
  compact?: boolean;
};

export function ProfileEditableDetails({ user, setUser, compact = false }: ProfileEditableDetailsProps) {
  const [usernameWarning, setUsernameWarning] = useState(false);

  const handleUserProfileUpdate = async (field: string, value: unknown): Promise<boolean> => {
    await updateUser(user.userId, { [field]: value });
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
    bustUserLocalStorageCache();
    return true;
  };

  return (
    <>
      <h2 className="mb-1 md:mb-2 lg:mt-1 text-xl">Personal Details</h2>
      <div className="mb-2 h-[1px] bg-[#ccc]" />
      <ul className="w-full">
        <RenderEditableField
          label="First Name"
          value={user.firstName}
          type={FieldTypes.SHORT_TEXT}
          onSubmit={async (value) => {
            await handleUserProfileUpdate("firstName", value);
            await handleUserProfileUpdate("nameTokens", value.toLowerCase().split(" "));
            return true;
          }}
        />
        <RenderEditableField
          label="Last Name"
          value={user.surname}
          type={FieldTypes.SHORT_TEXT}
          onSubmit={(value) => handleUserProfileUpdate("surname", value)}
        />
        <RenderEditableField
          label="Location"
          value={user.location}
          type={FieldTypes.SHORT_TEXT}
          onSubmit={(value) => handleUserProfileUpdate("location", value)}
        />
        <RenderEditableField
          label="Date of Birth"
          value={user.dob}
          type={FieldTypes.DATE}
          onSubmit={(value) => handleUserProfileUpdate("dob", value)}
        />
        <RenderEditableField
          label="Gender"
          value={user.gender}
          type={FieldTypes.SELECT}
          options={["Male", "Female"]}
          onSubmit={(value) => handleUserProfileUpdate("gender", value)}
        />
      </ul>
      <h2 className="mb-1 mt-6 text-xl md:mb-2 lg:mt-8">Public Info</h2>
      <div className="mb-2 h-[1px] bg-[#ccc]" />
      <ul className="w-full">
        <RenderEditableField
          label="Contact Email"
          value={user.publicContactInformation.email}
          type={FieldTypes.SHORT_TEXT}
          onSubmit={(value) =>
            handleUserProfileUpdate("publicContactInformation", {
              ...user.publicContactInformation,
              email: value,
            })
          }
        />
        <RenderEditableField
          label="Phone Number"
          value={user.publicContactInformation.mobile}
          type={FieldTypes.SHORT_TEXT}
          customValidation={(input) => /^\d*$/.test(input)}
          onSubmit={(value) =>
            handleUserProfileUpdate("publicContactInformation", {
              ...user.publicContactInformation,
              mobile: value,
            })
          }
        />
        <RenderEditableField
          label="Bio"
          value={user.bio}
          type={FieldTypes.LONG_TEXT}
          onSubmit={(value) => handleUserProfileUpdate("bio", value)}
        />
      </ul>
      <h2 className="mb-1 mt-6 text-xl md:mb-2 lg:mt-8">Private Info</h2>
      <div className="mb-2 h-[1px] bg-[#ccc]" />
      <ul className="w-full">
        {!compact && <RenderNonEditableField label="User ID" value={user.userId} />}
        {usernameWarning && (
          <div className="mb-2 text-xs font-light text-red-900">Username update failed, try another username.</div>
        )}
        <RenderEditableField
          label="Username"
          value={user.username}
          type={FieldTypes.SHORT_TEXT}
          onSubmit={async (value) => {
            const isUsernameExist = await updateUsername(user.userId, value);
            if (!isUsernameExist) {
              setUsernameWarning(true);
              return false;
            }
            setUsernameWarning(false);
            bustUserLocalStorageCache();
            setUser((prev) => ({
              ...prev,
              username: value,
            }));
            return true;
          }}
        />
        {!compact && <RenderNonEditableField label="Private Email" value={user.contactInformation.email} />}
        <RenderEditableField
          label="Private Phone Number"
          value={user.contactInformation.mobile}
          type={FieldTypes.SHORT_TEXT}
          customValidation={(input) => /^\d*$/.test(input)}
          onSubmit={(value) =>
            handleUserProfileUpdate("contactInformation", { ...user.contactInformation, mobile: value })
          }
        />
      </ul>
    </>
  );
}
