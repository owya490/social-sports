"use client";

import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { updateUser } from "@/services/src/users/usersService";
import { useState } from "react";

const logger = new Logger("SettingsPreferencesPanel");

export function SettingsPreferencesPanel() {
  const { user, setUser } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateSendOrganiserTicketEmail = async (newValue: boolean) => {
    if (!user.userId || isUpdating) return;

    setIsUpdating(true);
    const previousValue = user.sendOrganiserTicketEmails;

    try {
      setUser((prevUser) => ({ ...prevUser, sendOrganiserTicketEmails: newValue }));
      await updateUser(user.userId, { sendOrganiserTicketEmails: newValue });
    } catch (error) {
      setUser((prevUser) => ({ ...prevUser, sendOrganiserTicketEmails: previousValue }));
      logger.error("Failed to update email preference", {
        userId: user.userId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const enabled = user.sendOrganiserTicketEmails;

  return (
    <section
      aria-label="Email preferences"
      className="rounded-xl border border-border bg-background overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground font-sans">Email preferences</h2>
        <p className="mt-0.5 text-xs text-foreground-muted font-sans">
          Choose what SPORTSHUB sends you about ticket sales.
        </p>
      </div>
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground font-sans">Ticket confirmation emails</p>
          <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
            Get the same confirmation email as the attendee whenever someone buys a ticket to your event.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Ticket confirmation emails"
          disabled={isUpdating || !user.userId}
          onClick={() => {
            void updateSendOrganiserTicketEmail(!enabled);
          }}
          className={`relative shrink-0 h-5 w-9 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${
            enabled ? "bg-accent" : "bg-surface-muted"
          }`}
        >
          <span
            aria-hidden
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
