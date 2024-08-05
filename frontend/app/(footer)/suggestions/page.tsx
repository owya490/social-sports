// At the top of your file, before any other imports
"use client";

import { Logger } from "@/observability/logger";
import Logo from "@/components/navbar/Logo";
import LightBulbIcon from "@/svgs/LightBulbIcon";
import emailjs from "emailjs-com";
import React, { useState } from "react";

export const emailJSLogger = new Logger("emailJSLogger");

export default function Suggestions() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Fetch environment variables and handle potential undefined values
  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const userId = process.env.REACT_APP_EMAILJS_USER_ID;

  emailJSLogger.info(`Service ID: ${serviceId}`);
  emailJSLogger.info(`Template ID: ${templateId}`);
  emailJSLogger.info(`User ID: ${userId}`);

  /// Ensure the required environment variables are defined
  if (!serviceId || !templateId || !userId) {
    emailJSLogger.error("Missing necessary environment variables for EmailJS.");
    throw new Error("Missing necessary environment variables for EmailJS.");
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const templateParams = {
      firstName,
      lastName,
      email,
      message,
    };

    // Send email using EmailJS
    emailjs
      .send(serviceId, templateId, templateParams, userId)
      .then((response) => {
        emailJSLogger.info(`SUCCESS! Status: ${response.status}, Text: ${response.text}`);
        alert("Thank you for your feedback!");
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
      })
      .catch((err) => {
        emailJSLogger.error(`Error: ${err}. Failed to send feedback. Please try again later.`);
        alert("Failed to send feedback. Please try again later.");
      });
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
          <button type="submit" className="w-full bg-[#30ADFF] py-2 text-white text-xl rounded-lg">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
