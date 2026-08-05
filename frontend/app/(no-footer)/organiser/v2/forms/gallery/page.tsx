"use client";

import { FormsGalleryHeader } from "@/components/organiser/v2/forms/FormsGalleryHeader";
import { FormsList } from "@/components/organiser/v2/forms/FormsList";
import { useUser } from "@/components/utility/UserContext";
import { Form } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getFormsForUser } from "@/services/src/forms/formsServices";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserFormsGalleryV2");

export default function OrganiserFormsGalleryV2Page() {
  const { user, userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchForms = async () => {
    if (user.userId === "") {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const data = await getFormsForUser(user.userId);
      setForms(data);
    } catch (fetchError) {
      logger.error(`Failed to get organiser forms: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoading) {
      return;
    }
    if (user.userId === "") {
      setLoading(false);
      setForms([]);
      return;
    }
    void fetchForms();
  }, [user.userId, userLoading]);

  return (
    <>
      {/* THESIS: A scannable form catalogue—open edit or preview in one tap, no miniature document previews.
          OWN-WORLD: Honest Clubhouse tokens—shared row language with Event collections and Custom links.
          STORY: Create or open a form; editor and preview stay on legacy paths.
          FIRST VIEWPORT: Title + create CTA, unified row panel below.
          FORM: Established v2 operate extension; list-only port (editor/preview stay legacy).
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <FormsGalleryHeader formCount={forms.length} loading={loading} />

        {error ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
            <div className="rounded-xl border border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Could not load forms</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => {
                  void fetchForms();
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <FormsList forms={forms} loading={loading} />
        )}
      </div>
    </>
  );
}
