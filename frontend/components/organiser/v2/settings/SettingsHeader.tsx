"use client";

type SettingsHeaderProps = {
  subtitle: string;
};

export function SettingsHeader({ subtitle }: SettingsHeaderProps) {
  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4 max-w-6xl mx-auto">
      <div className="min-w-0">
        <h1 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-foreground-secondary font-sans">{subtitle}</p>
      </div>
    </header>
  );
}
