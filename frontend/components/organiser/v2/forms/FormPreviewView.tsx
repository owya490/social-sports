"use client";

import FormResponder from "@/components/forms/FormResponder";
import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { FormId } from "@/interfaces/FormTypes";
import { getForm } from "@/services/src/forms/formsServices";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

type FormPreviewViewProps = {
  formId: FormId;
};

export function FormPreviewView({ formId }: FormPreviewViewProps) {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getForm(formId)
      .then((form) => {
        if (!cancelled) setTitle(form.title?.trim() || "Untitled form");
      })
      .catch(() => {
        if (!cancelled) setTitle("Preview");
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  useOrganiserBreadcrumbTitle(title);

  return (
    <div className="min-h-screen bg-surface text-foreground pb-10">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-2">
        <OrganiserBreadcrumbs />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
              Preview
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary font-sans">
              How this form looks to people filling it in
            </p>
          </div>
          <Link
            href={`/organiser/v2/forms/${formId}/editor`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden />
            Edit
          </Link>
        </div>
      </header>

      <FormResponder formId={formId} formResponseId={null} isPreview={true} variant="compact" />
    </div>
  );
}
