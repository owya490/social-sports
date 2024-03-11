"use client";
import React, { useState } from "react";
import {
  handleEmailAndPasswordSignUp,
  userAuthData,
} from "@/services/authService";
import { useRouter } from "next/navigation";
import { Alert } from "@material-tailwind/react";
import { FirebaseError } from "firebase/app";
import { useMultistepForm } from "@/components/events/create/useMultistepForm";
import { BasicRegisterInformation } from "@/components/register/BasicRegisterForm";
import RegisterStepper from "@/components/register/RegisterStepper";
import { PublicRegisterForm } from "@/components/register/PublicRegisterForm";
import { uploadUserImage } from "@/services/imageService";

type RegisterData = {
  profilePic: File | null;
  email: string;
  password: string;
  repeatPassword: string;
  passwordMismatch: boolean;
  firstName: string;
  lastName: string;
  mobile: string;
  dob: string;
  location: string;
  sport: string;
  gender: string;
};

const INITIAL_DATA: RegisterData = {
  profilePic: null,
  email: "",
  password: "",
  repeatPassword: "",
  passwordMismatch: false,
  firstName: "",
  lastName: "",
  mobile: "",
  dob: "",
  location: "",
  sport: "volleyball",
  gender: "male",
};

export default function Register() {
  const [userData, setUserData] = useState(INITIAL_DATA);
  const router = useRouter();

  const [showRegisterFailure, setShowRegisterFailure] = useState(false);
  const [error, setError] = useState("");

  const { step, steps, currentStep, isFirstStep, isLastStep, back, next } =
    useMultistepForm([
      <PublicRegisterForm {...userData} updateField={updateFields} />,
      <BasicRegisterInformation {...userData} updateField={updateFields} />,
    ]);

  function updateFields(fields: Partial<RegisterData>) {
    setUserData((prev) => {
      return { ...prev, ...fields };
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLastStep) {
      next();
      return;
    }

    if (userData.password !== userData.repeatPassword) {
      updateFields({ passwordMismatch: true });
      setShowRegisterFailure(false);
      return;
    } else {
      updateFields({ passwordMismatch: false });
    }

    try {
      const userId = await handleEmailAndPasswordSignUp(
        convertUserDataToUserAuthData(userData)
      );
      console.log(userId);
      if (userData.profilePic) {
        uploadUserImage(userId, userData.profilePic);
      }
      router.push("/dashboard?login=success");
    } catch (error) {
      setShowRegisterFailure(true);
      updateFields({ passwordMismatch: false });

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

  function convertUserDataToUserAuthData(userData: RegisterData): userAuthData {
    return {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      surname: userData.lastName,
      mobile: userData.mobile,
      dob: userData.dob,
      location: userData.location,
      sport: userData.sport,
      gender: userData.gender,
    };
  }

  return (
    <div className="flex p-6 min-h-[95vh] flex-1 flex-col mt-20 sm:mt-30">
      <form onSubmit={handleSubmit}>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Alert
            open={userData.passwordMismatch}
            onClose={() => updateFields({ passwordMismatch: false })}
            color="red"
            className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
          >
            Passwords do not match.
          </Alert>
          <Alert
            open={showRegisterFailure}
            onClose={() => setShowRegisterFailure(false)}
            color="red"
            className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
          >
            {error}
          </Alert>
          <h2 className="mt-[5vh] mb-8 sm:mt-0 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 ">
            Register your account
          </h2>
          <div className="mx-16">
            <RegisterStepper activeStep={currentStep} />
          </div>
        </div>

        {step}

        <div className="flex justify-end mt-8 sm:mr-4">
          {!isFirstStep && (
            <button
              type="button"
              className="rounded-md px-7 py-2 text-md font-semibold leading-6 shadow-sm hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-black border mr-4"
              onClick={back}
            >
              Back
            </button>
          )}
          {!isLastStep && (
            <button
              type="submit"
              className="rounded-md px-7 py-2 text-md font-semibold leading-6 shadow-sm bg-black text-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-black border"
            >
              Next
            </button>
          )}
          {isLastStep && (
            <button
              type="submit"
              className="rounded-md px-7 py-2 text-md font-semibold leading-6 shadow-sm bg-black text-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 border-black border"
            >
              Register
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
