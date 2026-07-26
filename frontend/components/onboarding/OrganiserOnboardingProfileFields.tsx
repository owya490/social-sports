"use client";

import { FieldTypes, RenderEditableField } from "@/components/users/profile/ProfileFields";
import { UserData } from "@/interfaces/UserTypes";
import { updateUser } from "@/services/src/users/usersService";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import { updateUsername } from "@/services/src/users/usersUtils/usernameUtils";
import { Dispatch, SetStateAction, useState } from "react";

/** Minimal organiser-facing fields; full profile (DOB, gender, phones, etc.) stays on /profile. */
export function OrganiserOnboardingProfileFields({
  user,
  setUser,
}: {
  user: UserData;
  setUser: Dispatch<SetStateAction<UserData>>;
}) {
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
    <div className="w-full space-y-1">
      <RenderEditableField
        label="First name"
        value={user.firstName}
        type={FieldTypes.SHORT_TEXT}
        onSubmit={async (value) => {
          await handleUserProfileUpdate("firstName", value);
          await handleUserProfileUpdate("nameTokens", value.toLowerCase().split(/\s+/).filter(Boolean));
          return true;
        }}
      />
      <RenderEditableField
        label="Last name"
        value={user.surname}
        type={FieldTypes.SHORT_TEXT}
        onSubmit={(value) => handleUserProfileUpdate("surname", value)}
      />
      {usernameWarning && <p className="py-1 text-xs text-red-800">That username is taken — try another.</p>}
      <RenderEditableField
        label="Username"
        value={user.username}
        type={FieldTypes.SHORT_TEXT}
        onSubmit={async (value) => {
          const ok = await updateUsername(user.userId, value);
          if (!ok) {
            setUsernameWarning(true);
            return false;
          }
          setUsernameWarning(false);
          bustUserLocalStorageCache();
          setUser((prev) => ({ ...prev, username: value }));
          return true;
        }}
      />
      <RenderEditableField
        label="Location"
        value={user.location}
        type={FieldTypes.SHORT_TEXT}
        onSubmit={(value) => handleUserProfileUpdate("location", value)}
      />
      <RenderEditableField
        label="Bio"
        value={user.bio}
        type={FieldTypes.LONG_TEXT}
        onSubmit={(value) => handleUserProfileUpdate("bio", value)}
      />
    </div>
  );
}
