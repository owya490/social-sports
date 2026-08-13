"use client";

import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { UserInlineDisplay } from "@/components/users/UserInlineDisplay";
import { PublicUserData } from "@/interfaces/UserTypes";

export function CompactHeaderSection({
  formTitle,
  formDescription,
  organiser,
}: {
  formTitle: string;
  formDescription: string;
  organiser: PublicUserData;
}) {
  return (
    <header className="rounded-xl border border-border bg-background px-4 py-4 sm:px-5 sm:py-5">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans leading-tight">
        {formTitle}
      </h1>
      <div className="mt-1.5 text-sm text-foreground-secondary">
        <UserInlineDisplay organiser={organiser} />
      </div>
      {formDescription ? (
        <div className="mt-4 text-sm text-foreground-secondary font-sans [&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p]:my-1">
          <RichTextEditorContent description={formDescription} />
        </div>
      ) : null}
    </header>
  );
}
