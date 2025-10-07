"use client";

import { Logger } from "@/observability/logger";
import { resetUserPassword } from "@/services/src/auth/authService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const logger = new Logger("resetPasswordLogger");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetSuccess(false);
    setResetFailed(false);

    startTransition(async () => {
      try {
        await resetUserPassword(email);
        // Sleep is necessary for better UX and help rate limit
        await sleep(500);
        setResetSuccess(true);
      } catch (error: any) {
        logger.error("Error: ", error?.message || error);
        if (error instanceof Error) console.error(error.message);
        setResetFailed(true);
      }
    });
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
            <Link href="/login" className="font-semibold leading-6 text-black hover:underline flex justify-center">
              Return back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
