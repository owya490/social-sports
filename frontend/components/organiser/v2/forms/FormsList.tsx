"use client";

import { Form } from "@/interfaces/FormTypes";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { FormRow, FormRowSkeleton } from "./FormRow";

type FormsListProps = {
  forms: Form[];
  loading: boolean;
};

export function FormsList({ forms, loading }: FormsListProps) {
  return (
    <section aria-label="Forms" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10">
      {loading ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, index) => (
              <FormRowSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : forms.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-6 py-12 text-center">
          <DocumentTextIcon className="mx-auto h-10 w-10 text-foreground-muted" aria-hidden />
          <p className="mt-4 text-sm font-semibold text-foreground font-sans">No forms yet</p>
          <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm mx-auto">
            Create a form to collect info when people book your sessions.
          </p>
          <Link
            href="/organiser/forms/create-form/editor"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Create form
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="divide-y divide-border">
            {forms.map((form) => (
              <FormRow key={form.formId} form={form} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
