"use client";
import { Logger } from "@/observability/logger";
import { handleEmailAndPasswordSignIn } from "@/services/src/auth/authService";
import { Alert } from "@material-tailwind/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

export default function Login() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const logger = new Logger("loginLogger");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAlertClose();

    startTransition(async () => {
      try {
        const userCreated = await handleEmailAndPasswordSignIn(userData.email, userData.password);
        if (userCreated) {
          router.push("/dashboard?login=success"); // Redirect only if user creation is successful
        } else {
          throw new Error("Could not find user");
        }
      } catch (error: any) {
        logger.error("Error: ", error?.message || error);
        if (error instanceof Error) setErrorMessage(error.message);
        setAlertStatus(true);
      }
    });
  };

  const handleAlertClose = () => {
    setAlertStatus(false);
    setErrorMessage("");
  };

  return (
    <div className="flex p-6 min-h-[100vh] flex-1 flex-col mt-20 sm:mt-40">
      <Alert
        open={alertStatus}
        onClose={handleAlertClose}
        color="red"
        className="absolute ml-auto mr-auto left-0 right-0 top-24 w-fit"
      >
        {errorMessage}
      </Alert>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-3xl font-bold leading-9 tracking-tight text-gray-900 mt-[10vh] sm:mt-0">
          Sign in to your account
        </h1>
      </div>

      <div className="mt-8 mx-auto w-full max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                tabIndex={1}
                required
                className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm: sm:leading-6"
                value={userData.email}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    email: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block font-medium leading-6 text-gray-900">
                Password
              </label>
              <div>
                <Link href="resetPassword" className="font-semibold text-sm text-gray-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                tabIndex={2}
                required
                className="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm: sm:leading-6"
                value={userData.password}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    password: e.target.value,
                  })
                }
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
              {isPending ? <>Loading...</> : <>Sign in</>}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-gray-500">
          Not a member?{" "}
          <Link href="/register" className="font-semibold leading-6 text-black hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
