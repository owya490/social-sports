"use client";
import { EmptyNewUserData, NewUserData } from "@/interfaces/UserTypes";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  handleAppleSignIn,
  handleEmailAndPasswordSignUp,
  handleGoogleSignIn,
} from "@/services/src/auth/authService";
import { getFullUserById } from "@/services/src/users/usersService";
import { Alert } from "@material-tailwind/react";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

export default function Register() {
  const [userData, setUserData] = useState<NewUserData>(EmptyNewUserData);
  const router = useRouter();
  const { setUser } = useUser();
  const logger = new Logger("registerLogger");

  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showRegisterFailure, setShowRegisterFailure] = useState(false);
  const [showEmailSentAlert, setShowEmailSentAlert] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const completeOAuthRegistration = async (userId: string | null) => {
    if (userId !== null) {
      setUser(await getFullUserById(userId));
      router.push("/?login=success");
    } else {
      throw new Error("Could not complete registration");
    }
  };

  const handleOAuthRegister = (signIn: () => Promise<string | null>) => {
    setPasswordMismatch(false);
    setShowRegisterFailure(false);
    setShowEmailSentAlert(false);
    startTransition(async () => {
      try {
        const userId = await signIn();
        await completeOAuthRegistration(userId);
      } catch (err: unknown) {
        setShowRegisterFailure(true);
        const message = err instanceof Error ? err.message : String(err);
        logger.error("OAuth registration error", { message });
        setError(message);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMismatch(false);
    setShowRegisterFailure(false);
    setShowEmailSentAlert(false);

    startTransition(async () => {
      if (userData.password !== repeatPassword) {
        setPasswordMismatch(true);
        setShowRegisterFailure(false);
        return;
      }

      try {
        await handleEmailAndPasswordSignUp(userData);
        setShowEmailSentAlert(true);
      } catch (error: any) {
        setShowRegisterFailure(true);
        setPasswordMismatch(false);

        if (error instanceof FirebaseError) {
          switch (error.code) {
            case "auth/email-already-in-use":
              setError("This email is already in use.");
              break;
            case "auth/invalid-email":
              setError("Invalid email address.");
              break;
            case "auth/weak-password":
              setError("Password is too weak.");
              break;
            default:
              setError("An unexpected error occurred.");
          }
        } else {
          setError("An unexpected error occurred"); // Fallback error message
          logger.error(error?.message || error);
        }
        console.error("Error:", error);
      }
    });
  };

  const handleAlertClose = () => {
    setShowRegisterFailure(false);
    if (error == "This email is already in use.") {
      router.push("/login");
    }
  };

  return (
    <div className="flex px-6 min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] flex-1 flex-col sm:pt-40">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Alert
          open={passwordMismatch}
          onClose={() => setPasswordMismatch(false)}
          color="red"
          className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
        >
          Passwords do not match.
        </Alert>
        <Alert
          open={showRegisterFailure}
          onClose={() => handleAlertClose()}
          color="red"
          className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
        >
          {error}
        </Alert>
        <Alert
          open={showEmailSentAlert}
          onClose={() => setShowEmailSentAlert(false)}
          color="green"
          className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
        >
          Email sent. Please check your inbox.
        </Alert>
        <h2 className="mt-[5vh] sm:mt-0 text-center text-3xl font-bold leading-9 tracking-tight text-gray-900 ">
          Register your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-3 py-2 font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition-colors disabled:opacity-60"
            disabled={isPending}
            onClick={() => handleOAuthRegister(handleGoogleSignIn)}
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
            onClick={() => handleOAuthRegister(handleAppleSignIn)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        <p className="my-6 flex items-center gap-3 text-sm text-gray-500">
          <span className="h-px flex-1 bg-gray-200" />
          or register with email
          <span className="h-px flex-1 bg-gray-200" />
        </p>

        <form className="space-y-6 group" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="first-name" className="block font-medium leading-6 text-gray-900">
              First Name
            </label>
            <div className="mt-2">
              <input
                id="first-name"
                name="first-name"
                type="text"
                className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm sm:leading-6"
                value={userData.firstName}
                required
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    firstName: e.target.value,
                  })
                }
              />
            </div>
          </div>
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
                required
                className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm sm:leading-6"
                value={userData.contactInformation.email}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    contactInformation: {
                      ...userData.contactInformation,
                      email: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block font-medium leading-6 text-gray-900">
                Password (min. 6 characters)
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm sm:leading-6 ${
                  passwordMismatch ? "ring-red-400" : ""
                }`}
                required
                pattern=".{6,}"
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
            <div className="flex items-center justify-between">
              <label htmlFor="password-repeat" className="block font-medium leading-6 text-gray-900">
                Repeat Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password-repeat"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm sm:leading-6 ${
                  passwordMismatch ? "ring-red-400" : ""
                }`}
                required
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md px-3 py-2 font-semibold leading-6 text-white shadow-sm hover:bg-white hover:text-highlight-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-highlight-yellow bg-highlight-yellow border-2 transition-colors duration-300 transform"
              disabled={isPending}
            >
              {isPending ? <>Loading...</> : <>Register</>}
            </button>
          </div>

          <p className="mt-10 text-center text-gray-500">
            Have an account?{" "}
            <Link href="/login" className="font-semibold leading-6 text-black hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
