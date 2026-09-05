"use client";
import AuthSplitLayout, { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from "@/components/auth/AuthSplitLayout";
import { EmptyNewUserData, NewUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { handleEmailAndPasswordSignUp } from "@/services/src/auth/authService";
import { Alert } from "@material-tailwind/react";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

export default function Register() {
  const [userData, setUserData] = useState<NewUserData>(EmptyNewUserData);
  const router = useRouter();
  const logger = new Logger("registerLogger");

  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showRegisterFailure, setShowRegisterFailure] = useState(false);
  const [showEmailSentAlert, setShowEmailSentAlert] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

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
    <>
      <Alert
        open={passwordMismatch}
        onClose={() => setPasswordMismatch(false)}
        color="red"
        className="absolute ml-auto mr-auto left-0 right-0 top-6 w-fit z-30"
      >
        Passwords do not match.
      </Alert>
      <Alert
        open={showRegisterFailure}
        onClose={() => handleAlertClose()}
        color="red"
        className="absolute ml-auto mr-auto left-0 right-0 top-6 w-fit z-30"
      >
        {error}
      </Alert>
      <Alert
        open={showEmailSentAlert}
        onClose={() => setShowEmailSentAlert(false)}
        color="green"
        className="absolute ml-auto mr-auto left-0 right-0 top-6 w-fit z-30"
      >
        Email sent. Please check your inbox.
      </Alert>

      <AuthSplitLayout
        ctaTitle="Join Australia's best social sport registration platform."
        ctaBody="Discover volleyball, badminton, pickleball and more, then book or host your next session in minutes."
        ctaBackdrop="jumpman"
      >
        <h1 className="text-3xl font-bold tracking-tight text-core-text">Register</h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
          Create an account to host events in minutes.
        </p>

        <form className="mt-8 space-y-6 group" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="first-name" className="block font-medium leading-6 text-core-text">
              First Name
            </label>
            <div className="mt-2">
              <input
                id="first-name"
                name="first-name"
                type="text"
                className={AUTH_INPUT_CLASS}
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
            <label htmlFor="email" className="block font-medium leading-6 text-core-text">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={AUTH_INPUT_CLASS}
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
            <label htmlFor="password" className="block font-medium leading-6 text-core-text">
              Password (min. 6 characters)
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                className={`${AUTH_INPUT_CLASS} ${passwordMismatch ? "ring-red-400" : ""}`}
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
            <label htmlFor="password-repeat" className="block font-medium leading-6 text-core-text">
              Repeat Password
            </label>
            <div className="mt-2">
              <input
                id="password-repeat"
                name="password"
                type="password"
                className={`${AUTH_INPUT_CLASS} ${passwordMismatch ? "ring-red-400" : ""}`}
                required
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={AUTH_SUBMIT_CLASS} disabled={isPending}>
            {isPending ? "Loading..." : "Register"}
          </button>

          <p className="text-gray-500">
            Have an account?{" "}
            <Link href="/login" className="font-semibold leading-6 text-core-text hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </AuthSplitLayout>
    </>
  );
}
