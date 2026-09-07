"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EventId } from "@/interfaces/EventTypes";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { EventHubGhostButton } from "../EventHubStage";
import { EventHubCheckinModal } from "./EventHubCheckinModal";
import { EventHubQrScanner } from "./EventHubQrScanner";
import { eventHubFromCheckinPath } from "./eventHubCheckinPaths";
import { ScannedTicketPreview } from "./parseTicketQr";

export function EventHubCheckinView() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as EventId;
  const pathname = usePathname();
  const router = useRouter();
  const [preview, setPreview] = useState<ScannedTicketPreview | null>(null);

  useOrganiserBreadcrumbTitle("Check in");

  const backHref = eventHubFromCheckinPath(pathname, eventId);

  const handleScan = useCallback((next: ScannedTicketPreview) => {
    setPreview(next);
  }, []);

  const handleInvalidCode = useCallback(() => {
    toast.error("Couldn't read a ticket from that code.");
  }, []);

  const handleCancel = useCallback(() => {
    setPreview(null);
  }, []);

  const handleCheckIn = useCallback(() => {
    setPreview(null);
    toast.success("Checked in");
  }, []);

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <Toaster position="bottom-left" />
      <div className="bg-background border-b border-border">
        <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4">
          <OrganiserBreadcrumbs />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                Check in
              </h1>
              <p className="mt-1.5 text-xs text-foreground-muted font-sans">
                Point the camera at a ticket QR code.
              </p>
            </div>
            <EventHubGhostButton onClick={() => router.push(backHref)}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Back
            </EventHubGhostButton>
          </div>
        </header>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-6 sm:pt-8">
        <div className="max-w-lg mx-auto">
          <EventHubQrScanner
            paused={preview !== null}
            onScan={handleScan}
            onInvalidCode={handleInvalidCode}
          />
          <p className="mt-3 text-center text-xs text-foreground-muted font-sans">
            Check-in is local only for now — nothing is saved.
          </p>
        </div>
      </div>

      <EventHubCheckinModal preview={preview} onCancel={handleCancel} onCheckIn={handleCheckIn} />
    </div>
  );
}
