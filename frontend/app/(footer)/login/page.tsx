"use client";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  handleAppleSignIn,
  handleEmailAndPasswordSignIn,
  handleGoogleSignIn,
  shouldRedirectToRegisterAfterFailedLogin,
} from "@/services/src/auth/authService";
import { getFullUserById } from "@/services/src/users/usersService";
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
  const { setUser } = useUser();
  const logger = new Logger("loginLogger");

  const completeLogin = async (userId: string | null) => {
    if (userId !== null) {
      setUser(await getFullUserById(userId));
      router.push("/?login=success");
    } else {
      throw new Error("Could not find user");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAlertClose();

    startTransition(async () => {
      try {
        const userId = await handleEmailAndPasswordSignIn(userData.email, userData.password);
        await completeLogin(userId);
      } catch (error: unknown) {
        if (shouldRedirectToRegisterAfterFailedLogin(error)) {
          router.push("/register");
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Login error", { message });
        if (error instanceof Error) setErrorMessage(error.message);
        setAlertStatus(true);
      }
    });
  };

  const handleOAuthSignIn = (signIn: () => Promise<string | null>) => {
    handleAlertClose();
    startTransition(async () => {
      try {
        const userId = await signIn();
        await completeLogin(userId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("OAuth sign-in error", { message });
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
    <div className="flex px-6 min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] flex-1 flex-col pt-8 sm:pt-40">
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
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors disabled:opacity-60"
            disabled={isPending}
            onClick={() => handleOAuthSignIn(handleGoogleSignIn)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-900 bg-black px-3 py-2 font-semibold leading-6 text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors disabled:opacity-60"
            disabled={isPending}
            onClick={() => handleOAuthSignIn(handleAppleSignIn)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        <p className="my-6 flex items-center gap-3 text-sm text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          or sign in with email
          <span className="h-px flex-1 bg-gray-200" />
        </p>

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
