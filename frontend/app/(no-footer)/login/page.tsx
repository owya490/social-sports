"use client";
import AuthSplitLayout, { AUTH_INPUT_CLASS, AUTH_SUBMIT_CLASS } from "@/components/auth/AuthSplitLayout";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { handleEmailAndPasswordSignIn } from "@/services/src/auth/authService";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleAlertClose();

    startTransition(async () => {
      try {
        const userCreated = await handleEmailAndPasswordSignIn(userData.email, userData.password);
        if (userCreated !== null) {
          setUser(await getFullUserById(userCreated));
          router.push("/?login=success"); // Redirect only if user creation is successful
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
    <>
      <Alert
        open={alertStatus}
        onClose={handleAlertClose}
        color="red"
        className="absolute ml-auto mr-auto left-0 right-0 top-6 w-fit z-30"
      >
        {errorMessage}
      </Alert>

      <AuthSplitLayout
        ctaTitle="Find your next social sport session."
        ctaBody="Log in to book games near you, manage your spots, and pick up where your community left off."
      >
        <h1 className="text-3xl font-bold tracking-tight text-core-text">Sign in</h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
          Welcome back. Use your email to continue.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                tabIndex={1}
                required
                className={AUTH_INPUT_CLASS}
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
              <label htmlFor="password" className="block font-medium leading-6 text-core-text">
                Password
              </label>
              <Link href="resetPassword" className="font-semibold text-sm text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                tabIndex={2}
                required
                className={AUTH_INPUT_CLASS}
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

          <button type="submit" className={AUTH_SUBMIT_CLASS} tabIndex={3} disabled={isPending}>
            {isPending ? "Loading..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-gray-500">
          Not a member?{" "}
          <Link href="/register" className="font-semibold leading-6 text-core-text hover:underline">
            Register here
          </Link>
        </p>
      </AuthSplitLayout>
    </>
  );
}
