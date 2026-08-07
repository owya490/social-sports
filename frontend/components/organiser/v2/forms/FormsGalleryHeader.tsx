"use client";

type FormsGalleryHeaderProps = {
  formCount: number;
  loading: boolean;
};

export function FormsGalleryHeader({ formCount, loading }: FormsGalleryHeaderProps) {
  const subtitle = loading
    ? "Loading your forms…"
    : formCount === 0
      ? "Build forms for bookings and check-ins"
      : `${formCount} form${formCount === 1 ? "" : "s"} ready to attach`;

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-5 max-w-6xl mx-auto">
      <div className="min-w-0">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
          Forms
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
      </div>
    </header>
  );
}
