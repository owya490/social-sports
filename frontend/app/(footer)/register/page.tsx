"use client";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EmptyNewUserData, NewUserData } from "@/interfaces/UserTypes";
import { handleEmailAndPasswordSignUp } from "@/services/src/auth/authService";
import { Alert } from "@material-tailwind/react";
import { FirebaseError } from "firebase/app";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function Register() {
  const [userData, setUserData] = useState<NewUserData>(EmptyNewUserData);
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      router.push("/dashboard"); 
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showRegisterFailure, setShowRegisterFailure] = useState(false);
  const [showEmailSentAlert, setShowEmailSentAlert] = useState(false);
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
      setShowEmailSentAlert(true);
    } catch (error) {
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
      }
      console.error("Error:", error);
    }
  };

  const handleAlertClose = () => {
    setShowRegisterFailure(false);
    if (error == "This email is already in use.") {
      router.push("/login");
    }
  };

  return loading ? (
    <Loading />
  ) : (
    <div className="flex p-6 min-h-[100vh] flex-1 flex-col mt-20 sm:mt-40">
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
          Email sent successfully. Please check your inbox.
        </Alert>
        <h2 className="mt-[5vh] sm:mt-0 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 ">
          Register your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6 group" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">
              First Name
            </label>
            <div className="mt-2">
              <input
                id="first-name"
                name="first-name"
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
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
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
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
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Password (min. 6 characters)
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 ${
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
              <label htmlFor="password-repeat" className="block text-sm font-medium leading-6 text-gray-900">
                Repeat Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password-repeat"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 ${
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
              className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-black border-2"
            >
              Register
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
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
