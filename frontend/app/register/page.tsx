"use client";
import React, { useState } from "react";
import { handleEmailAndPasswordSignUp } from "@/services/authService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@material-tailwind/react";

export default function Register() {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    firstName: "",
  });
  const router = useRouter();

  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showRegisterFailure, setShowRegisterFailure] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userData.password !== repeatPassword) {
      setPasswordMismatch(true);
      setShowRegisterFailure(false);
      return;
    }

    try {
      await handleEmailAndPasswordSignUp(userData);
      router.push("/dashboard?login=success");
    } catch (error) {
      setShowRegisterFailure(true);
      setPasswordMismatch(false);

      if (error instanceof Error) {
        setError(error.message); // Set the error message
      } else {
        setError("An unexpected error occurred"); // Fallback error message
      }
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex min-h-full sm:min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 mt-4 sm:mt-0">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <Alert
          open={passwordMismatch}
          onClose={() => setPasswordMismatch(false)}
          color="red"
          className="absolute ml-auto mr-auto left-0 right-0 top-24 w-fit"
        >
          Passwords do not match.
        </Alert>
        <Alert
          open={showRegisterFailure}
          onClose={() => setShowRegisterFailure(false)}
          color="red"
          className="absolute ml-auto mr-auto left-0 right-0 top-24 w-fit"
        >
          {error}
        </Alert>
        <h2 className="mt-10 sm:mt-0 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Register your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6 group" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="first-name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              First Name
            </label>
            <div className="mt-2">
              <input
                id="first-name"
                name="first-name"
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
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
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
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
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password (min. 6 characters)
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6 ${
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
              <label
                htmlFor="password-repeat"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Repeat Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password-repeat"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6 ${
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
              className="flex w-full justify-center rounded-md bg-[#30ADFF] px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 "
            >
              Register
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-semibold leading-6 text-[#30ADFF] hover:underline"
            >
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
