"use client";

import FormResponder from "@/components/forms/FormResponder";
import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponseId } from "@/interfaces/FormTypes";

type FormResponseViewerProps = {
  formId: FormId;
  eventId: EventId;
  responseId: FormResponseId;
};

export function FormResponseViewer({ formId, eventId, responseId }: FormResponseViewerProps) {
  useOrganiserBreadcrumbTitle("Response");

  return (
    <div className="min-h-screen bg-surface text-foreground pb-10">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-2">
        <OrganiserBreadcrumbs />
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Response
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">Submitted answers for this booking</p>
        </div>
      </header>

      <FormResponder formId={formId} eventId={eventId} formResponseId={responseId} variant="compact" />
    </div>
  );
}
