"use client";

import {
  FormGalleryCard,
  FormGalleryCardSkeleton,
  FormGalleryCreateCard,
} from "@/components/organiser/v2/forms/FormGalleryCard";
import { Form } from "@/interfaces/FormTypes";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type FormsListProps = {
  forms: Form[];
  loading: boolean;
};

export function FormsList({ forms, loading }: FormsListProps) {
  return (
    <section aria-label="Forms" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }, (_, index) => (
            <FormGalleryCardSkeleton key={index} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          <FormGalleryCreateCard />
          <div className="sm:col-span-1 lg:col-span-2 xl:col-span-3 flex flex-col items-start justify-center rounded-xl border border-dashed border-border bg-background px-6 py-10">
            <DocumentTextIcon className="h-8 w-8 text-foreground-muted" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-foreground font-sans">No forms yet</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans max-w-sm">
              Create a form to collect info when people book your sessions.
            </p>
            <Link
              href="/organiser/forms/create-form/editor?returnTo=/organiser/v2/forms/gallery"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Create form
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          <FormGalleryCreateCard />
          {forms.map((form) => (
            <FormGalleryCard key={form.formId} form={form} />
          ))}
        </div>
      )}
    </section>
  );
}
