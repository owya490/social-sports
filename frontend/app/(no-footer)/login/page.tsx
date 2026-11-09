"use client";
import AuthSplitLayout, {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_CLASS,
} from "@/components/auth/AuthSplitLayout";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { useAuthPageNavigation } from "@/components/auth/useAuthPageNavigation";
import { Logger } from "@/observability/logger";
import { getAuthPageHref } from "@/services/src/auth/authNavigation";
import { handleEmailAndPasswordSignIn } from "@/services/src/auth/authService";
import { Alert } from "@material-tailwind/react";
import Link from "next/link";
import React, { Suspense, useState } from "react";

export default function Login() {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm text-gray-500">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [alertStatus, setAlertStatus] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [socialPending, setSocialPending] = useState(false);
  const { returnTo, beginSignIn, completeSignIn } = useAuthPageNavigation();
  const logger = new Logger("loginLogger");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || socialPending) return;
    beginSignIn();
    handleAlertClose();
    setIsPending(true);
    try {
      const userId = await handleEmailAndPasswordSignIn(userData.email, userData.password, returnTo);
      if (userId !== null) {
        await completeSignIn(userId);
      } else {
        throw new Error("Could not find user");
      }
    } catch (error) {
      logger.error("Email sign-in failed", { error: error instanceof Error ? error.message : String(error) });
      setErrorMessage(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
      setAlertStatus(true);
    } finally {
      setIsPending(false);
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-core-text">Sign in</h1>
        <p className="mt-1 text-sm font-light leading-snug text-gray-500">
          Welcome back. Use your email to continue.
        </p>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className={AUTH_LABEL_CLASS}>
              Email address
            </label>
            <div className="mt-1">
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
              <label htmlFor="password" className={AUTH_LABEL_CLASS}>
                Password
              </label>
              <Link href={getAuthPageHref("/resetPassword", returnTo)} className="font-semibold text-sm text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="mt-1">
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

          <button type="submit" className={AUTH_SUBMIT_CLASS} tabIndex={3} disabled={isPending || socialPending}>
            {isPending ? "Loading..." : "Sign in"}
          </button>
        </form>

        <SocialAuthButtons
          disabled={isPending}
          onPendingChange={(pending) => {
            if (pending) beginSignIn();
            setSocialPending(pending);
          }}
          onError={(message) => {
            setErrorMessage(message);
            setAlertStatus(true);
          }}
          onSuccess={completeSignIn}
        />

        <p className="mt-4 text-sm text-gray-500">
          Not a member?{" "}
          <Link href={getAuthPageHref("/register", returnTo)} className="font-semibold leading-6 text-core-text hover:underline">
            Register here
          </Link>
        </p>
      </AuthSplitLayout>
    </>
  );
}
