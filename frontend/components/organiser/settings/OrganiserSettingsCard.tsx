"use client";

import { LabelledSwitch } from "@/components/elements/LabelledSwitch";
import { useUser } from "@/components/utility/UserContext";
import { updateUser } from "@/services/src/users/usersService";
import { useState } from "react";

const OrganiserSettingsCard = () => {
  const { user, setUser } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSendOrganiserTicketEmail = async (newValue: boolean) => {
    if (!user.userId || isUpdating) {
      return;
    }

    setIsUpdating(true);
    const previousValue = user.sendOrganiserTicketEmails;

    try {
      // Optimistic update
      setUser({ ...user, sendOrganiserTicketEmails: newValue });

      // API call
      await updateUser(user.userId, { sendOrganiserTicketEmails: newValue });
    } catch (error) {
      // Rollback on error
      setUser({ ...user, sendOrganiserTicketEmails: previousValue });
      console.error("Failed to update email preference:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-organiser-light-gray p-6 sm:p-8 rounded-2xl">
      <h2 className="font-bold text-2xl sm:text-3xl mb-6">Email Preferences</h2>
      <div className="space-y-4">
        <LabelledSwitch
          title={"Receive Ticket Confirmation Emails"}
          description={
            "Get notified via email whenever someone purchases a ticket to your event. You'll receive the same confirmation email as the attendee."
          }
          state={user.sendOrganiserTicketEmails}
          setState={(newValue: boolean) => {
            updateSendOrganiserTicketEmail(newValue);
          }}
          updateData={() => {}}
        />
      </div>
    </div>
  );
};

export default OrganiserSettingsCard;
