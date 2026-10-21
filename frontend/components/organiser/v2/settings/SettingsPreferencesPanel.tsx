"use client";

import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { updateUser } from "@/services/src/users/usersService";
import { useLayoutEffect, useRef, useState } from "react";
import { SettingsSaveFeedback } from "../shared/SettingsSaveFeedback";
import { useSettingsAutosave } from "../shared/useSettingsAutosave";

const logger = new Logger("SettingsPreferencesPanel");
const accountUnavailableMessage = "Your account is unavailable. Reload settings before trying again.";

export function SettingsPreferencesPanel() {
  const { user, userLoading, setUser, auth } = useUser();
  const [accountId] = useState(user.userId);
  const accountRef = useRef({ auth, userId: user.userId, userLoading });
  useLayoutEffect(() => {
    accountRef.current = { auth, userId: user.userId, userLoading };
  }, [auth, user.userId, userLoading]);
  const isCurrentAccount = () => Boolean(accountId) &&
    accountRef.current.userId === accountId &&
    accountRef.current.auth.currentUser?.uid === accountId;
  const accountMatches = Boolean(accountId) && user.userId === accountId && auth.currentUser?.uid === accountId;
  const accountReady = !userLoading && accountMatches;
  const mutationLockRef = useRef(false);
  const { status, isSaving, errorMessage, run, retry } = useSettingsAutosave<boolean>({
    mutationLockRef,
    failureMessage: "Your email preference couldn't be saved. The previous value has been restored.",
    prepare: (desiredValue) => {
      if (accountRef.current.userLoading || !isCurrentAccount()) {
        return { kind: "blocked", message: accountUnavailableMessage };
      }
      const userId = user.userId;
      const previousValue = user.sendOrganiserTicketEmails;
      return {
        kind: "ready",
        operation: {
          apply: () => {
            if (!isCurrentAccount()) return;
            setUser((prevUser) => isCurrentAccount() && prevUser.userId === userId
              ? { ...prevUser, sendOrganiserTicketEmails: desiredValue }
              : prevUser);
          },
          persist: async () => {
            if (accountRef.current.userLoading || !isCurrentAccount()) throw new Error(accountUnavailableMessage);
            try {
              await updateUser(userId, { sendOrganiserTicketEmails: desiredValue });
            } catch (error) {
              logger.error("Failed to update email preference", {
                userId,
                errorMessage: error instanceof Error ? error.message : String(error),
              });
              throw error;
            }
            if (!isCurrentAccount()) throw new Error(accountUnavailableMessage);
          },
          rollback: () => {
            if (!isCurrentAccount()) return;
            setUser((prevUser) => isCurrentAccount() && prevUser.userId === userId
              ? { ...prevUser, sendOrganiserTicketEmails: previousValue }
              : prevUser);
          },
        },
      };
    },
  });

  const enabled = user.sendOrganiserTicketEmails;

  return (
    <section
      aria-label="Email preferences"
      className="rounded-xl border border-border bg-background overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground font-sans">Email preferences</h2>
          <p className="mt-0.5 text-xs text-foreground-muted font-sans">
            Choose what SPORTSHUB sends you about ticket sales.
          </p>
        </div>
        <SettingsSaveFeedback status={accountMatches ? status : "idle"} onRetry={() => void retry()} errorMessage={errorMessage} retryDisabled={isSaving || !accountReady} />
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
          disabled={isSaving || !accountReady}
          onClick={() => {
            void run(!enabled);
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
