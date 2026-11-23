import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 border-t-4 border-t-accent bg-white px-6 py-7 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.18em] text-neutral-500">SPORTSHUB</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Internal</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in with your SPORTSHUB account.</p>
        <LoginForm />
      </div>
    </main>
  );
}
