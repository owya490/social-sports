import Link from "next/link";
import { FormWrapper } from "../events/create/FormWrapper";
import { ChangeEvent, useState } from "react";
import { uploadUserImage } from "@/services/imageService";

type PublicData = {
  firstName: string;
  lastName: string;
  profilePic: File | null;
};

type PublicRegisterFormProps = PublicData & {
  updateField: (fields: Partial<PublicData>) => void;
};

export function PublicRegisterForm({
  firstName,
  lastName,
  profilePic,
  updateField,
}: PublicRegisterFormProps) {
  const [preview, setPreview] = useState<boolean>(false);
  const [src, setSrc] = useState<string>("");

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (e) => {
           setSrc(e.target?.result);
         };
         reader.readAsDataURL(file);

        updateField({ profilePic: file });
        console.log("Image changed!", file);
      }
    }
  }

  return (
    <FormWrapper>
      <div className=" w-full sm:w-2/3 sm:max-w-sm space-y-6 group">
        <section className=" w-full sm:mx-auto items-center">
          <p className="block text-sm font-medium leading-6 text-gray-900 mb-2">
            Profile Picture (not required)
          </p>
          <img src={profilePic}></img>
          <div
            id="image-preview"
            className=" p-6 mb-2 bg-gray-100 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer"
          >
            <input
              id="upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleChange(e)}
            />
            <label htmlFor="upload" className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-gray-700 mx-auto mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="font-normal text-sm text-gray-400 md:px-6">
                Choose photo size should be less than{" "}
                <b className="text-gray-600">2mb</b>
              </p>
              <p className="font-normal text-sm text-gray-400 md:px-6">
                and should be in <b className="text-gray-600">JPG or PNG</b>{" "}
                format.
              </p>
              <span
                id="filename"
                className="text-gray-500 bg-gray-200 z-50"
              ></span>
            </label>
          </div>
        </section>
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
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
              value={firstName}
              required
              onChange={(e) => updateField({ firstName: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="last-name"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Last Name
          </label>
          <div className="mt-2">
            <input
              id="last-name"
              name="last-name"
              type="text"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
              value={lastName}
              required
              onChange={(e) => updateField({ lastName: e.target.value })}
            />
          </div>
        </div>
        {/* <p className="mt-10 text-center text-sm text-gray-500">
          Have an account?{" "}
          <Link
            href="/login"
            className="font-semibold leading-6 text-black hover:underline"
          >
            Login here
          </Link>
        </p> */}
      </div>
    </FormWrapper>
  );
}
