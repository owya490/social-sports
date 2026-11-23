import { SignOutButton } from "@/components/SignOutButton";
import { readReportingSession } from "@/lib/reportingSession";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InternalHomePage() {
  const session = await readReportingSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-t-4 border-accent bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-neutral-500">SPORTSHUB</p>
            <h1 className="text-lg font-semibold">Internal</h1>
          </div>
          <div className="flex items-center gap-4">
            {session.email ? <p className="text-sm text-neutral-600">{session.email}</p> : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="min-h-80 rounded-2xl border border-dashed border-neutral-300 bg-white p-8">
          <h2 className="text-sm font-medium text-neutral-500">Reporting</h2>
        </section>
      </main>
    </div>
  );
}
