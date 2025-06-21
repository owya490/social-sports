"use client";

import { LabelledSwitch } from "@/components/elements/LabelledSwitch";
import { useUser } from "@/components/utility/UserContext";
import { updateUser } from "@/services/src/users/usersService";

const OrganiserSettingsCard = () => {
  const { user, setUser } = useUser();

  const updateSendOrganiserTicketEmail = (event: boolean) => {
    updateUser(user.userId, { sendOrganiserTicketEmails: event });
  };

  return (
    <div className="pt-2 relative">
      <h2 className="font-bold text-4xl">Organiser Settings</h2>
      <div className="p-2 mt-4 space-y-4">
        <LabelledSwitch
          title={"Opt in for Ticket Emails"}
          description={"If enabled, you will also receive an identical Ticket Confirmation Email when a ticket is purchased."}
          state={user.sendOrganiserTicketEmails}
          setState={(event: boolean) => {
            setUser({ ...user, sendOrganiserTicketEmails: event });
          }}
          updateData={updateSendOrganiserTicketEmail}
        />
      </div>
    </div>
  );
};

export default OrganiserSettingsCard;
