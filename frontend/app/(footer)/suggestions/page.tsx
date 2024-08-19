"use client";

import Logo from "@/components/navbar/Logo";
import { sendEmail } from "@/services/src/emailJS/emailJS";
import LightBulbIcon from "@/svgs/LightBulbIcon";
import { useState } from "react";

// Define the type for template parameters
type SuggestionsTemplateParams = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

export default function Suggestions() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const templateParams: SuggestionsTemplateParams = {
      firstName,
      lastName,
      email,
      message,
    };

    try {
      await sendEmail(templateParams);
      alert("Thank you for your feedback!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      alert("Failed to send feedback. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen flex justify-center">
      <div className="screen-width-primary mx-3 mb-32 mt-20 md:mt-32 md:max-w-lg space-y-5">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="px-7 py-3 leading-normal bg-blue-100 rounded-lg text-center" role="alert">
          <span className="flex items-center justify-center">
            <LightBulbIcon />
            <h3 className="font-bold text-sm md:text-xl w-2/3">We Value your Suggestions and Feedback.</h3>
          </span>
          <div className="flex justify-center">
            <p className="w-3/4">
              We appreciate you taking the time to share your thoughts. Please input your Feedback/ Suggestion in the
              box below.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 w-full">
              <label className="block text-gray-700 text-sm font-bold mb-1">First Name</label>
              <input
                type="text"
                className="border border-black px-2 py-1 rounded-lg w-full"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="col-span-1 w-full">
              <label className="block text-gray-700 text-sm font-bold mb-1">Last Name</label>
              <input
                type="text"
                className="border border-black px-2 py-1 rounded-lg w-full"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
            <input
              type="email"
              className="border border-black px-2 py-1 rounded-lg w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-full">
            <label className="block text-gray-700 text-sm font-bold mb-1">Suggestion/ Feedback</label>
            <textarea
              rows={5}
              wrap="hard"
              maxLength={200}
              className="border border-black px-2 py-1 rounded-lg w-full h-32 max-h-44 min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-[#30ADFF] py-2 text-white text-xl rounded-lg" disabled={isLoading}>
            {isLoading ? "Sending..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
