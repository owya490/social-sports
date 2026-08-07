"use client";

import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { EventHubStage } from "@/components/organiser/v2/event-hub/EventHubStage";
import { useState } from "react";

type CollectionHubSettingsProps = {
  name: string;
  deleteLoading: boolean;
  onDelete: () => Promise<void>;
};

export function CollectionHubSettings({ name, deleteLoading, onDelete }: CollectionHubSettingsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <EventHubStage>
      {deleteLoading ? (
        <p className="text-xs text-foreground-muted font-sans pb-2" aria-live="polite">
          Deleting…
        </p>
      ) : null}

      <section className="pt-0">
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
