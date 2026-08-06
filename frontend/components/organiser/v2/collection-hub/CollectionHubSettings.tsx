"use client";

import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { EventHubPreferenceRow, EventHubStage } from "@/components/organiser/v2/event-hub/EventHubStage";
import { useState } from "react";

type CollectionHubSettingsProps = {
  name: string;
  isPrivate: boolean;
  privacyUpdating: boolean;
  deleteLoading: boolean;
  onTogglePrivacy: (nextPrivate: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function CollectionHubSettings({
  name,
  isPrivate,
  privacyUpdating,
  deleteLoading,
  onTogglePrivacy,
  onDelete,
}: CollectionHubSettingsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <EventHubStage>
      {(privacyUpdating || deleteLoading) && (
        <p className="text-xs text-foreground-muted font-sans pb-2" aria-live="polite">
          {deleteLoading ? "Deleting…" : "Saving…"}
        </p>
      )}

      <section className="pt-0">
        <h3 className="text-sm font-semibold text-foreground font-sans mb-1">Visibility</h3>
        <div className="divide-y divide-border border-t border-border">
          <EventHubPreferenceRow
            title="Private collection"
            description="When on, only people with the link can view. When off, the collection appears on your public profile."
            checked={isPrivate}
            disabled={privacyUpdating}
            onChange={(next) => {
              void onTogglePrivacy(next);
            }}
          />
        </div>
      </section>

      <section className="pt-6">
        <h3 className="text-sm font-semibold text-foreground font-sans mb-1">Danger zone</h3>
        <div className="divide-y divide-border border-t border-border">
          <div className="py-4">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-sm font-medium text-danger font-sans hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
            >
              Delete collection
            </button>
            <p className="mt-1.5 text-xs text-foreground-muted font-sans">
              Permanently remove this collection. Events inside are not deleted.
            </p>
          </div>
        </div>
      </section>

      <EventHubPanel
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete collection?"
        footer={
          <button
            type="button"
            onClick={() => {
              void onDelete();
            }}
            disabled={deleteLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 text-sm font-semibold text-white font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
          >
            Delete collection
          </button>
        }
      >
        <p className="text-sm text-foreground-secondary font-sans leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-foreground">{name}</span>? This
          cannot be undone. Events and recurring templates stay in your account.
        </p>
      </EventHubPanel>
    </EventHubStage>
  );
}
