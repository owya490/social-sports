"use client";

import { resetUserPassword } from "@/services/src/auth/authService";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@material-tailwind/react";

export default function resetPassword() {
  const [email, setEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await resetUserPassword(email);
      setResetSuccess(true);
    } catch (error) {
      console.error("Error:", error);
      setResetFailed(true);
    }
  };
  return (
    <div className="flex p-6 min-h-[100vh] flex-1 flex-col mt-20 sm:mt-40">
      <div className="mt-8 mx-auto w-full max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Please enter your email address to reset your password
            </label>
            <Alert
              open={resetSuccess}
              onClose={() => setResetSuccess(false)}
              color="green"
              className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
            >
              Request Sent
            </Alert>
            <Alert
              open={resetFailed}
              onClose={() => setResetFailed(false)}
              color="green"
              className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
            >
              Failed to send Email
            </Alert>
            <div className="mt-2">
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
              className="flex w-full justify-center rounded-lg bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-black border-2"
              tabIndex={3}
            >
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
