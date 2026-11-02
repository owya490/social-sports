"use client";

import { Logger } from "@/observability/logger";
import { getAuthPageHref, getSafeReturnTo } from "@/services/src/auth/authNavigation";
import { resetUserPassword } from "@/services/src/auth/authService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function ResetPassword() {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm text-gray-500">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const logger = new Logger("resetPasswordLogger");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    setResetSuccess(false);
    setResetFailed(false);

    setIsPending(true);
    try {
      await resetUserPassword(email, returnTo);
      await sleep(500);
      setResetSuccess(true);
    } catch (error) {
      logger.error("Password reset request failed", { error: error instanceof Error ? error.message : String(error) });
      if (error instanceof Error) console.error(error.message);
      setResetFailed(true);
    } finally {
      setIsPending(false);
    }
  };
  return (
    <div className="flex px-6 min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] flex-1 flex-col pt-16 sm:pt-40">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-3xl font-bold leading-9 tracking-tight text-gray-900 mt-[10vh] sm:mt-0">
          Reset your password
        </h1>
      </div>
      <div className="mt-8 mx-auto w-full max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="font-medium leading-6 text-gray-900">
              Please enter your email, make sure you check your junk and spam folders
            </label>
            <Alert
              open={resetSuccess}
              onClose={() => setResetSuccess(false)}
              color="green"
              className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
            >
              Request sent, please check your email
            </Alert>
            <Alert
              open={resetFailed}
              onClose={() => setResetFailed(false)}
              color="green"
              className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
            >
              Failed to send email
            </Alert>
            <div className="mt-4">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                tabIndex={1}
                required
                className="block w-full rounded-lg border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-lg bg-highlight-yellow text-white px-3 py-2 font-semibold leading-6 shadow-sm hover:bg-white hover:text-highlight-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-highlight-yellow border-2 transition-colors duration-300 transform"
              tabIndex={3}
              disabled={isPending}
            >
              {isPending ? <>Loading...</> : <>Send email</>}
            </button>
          </div>
          <div className="mt-4">
            <Link href={getAuthPageHref("/login", returnTo)} className="font-semibold leading-6 text-black hover:underline flex justify-center">
              Return back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
