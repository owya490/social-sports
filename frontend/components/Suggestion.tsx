import { sendEmail } from "@/services/src/emailJS/emailJS";

import { useState } from "react";

type SuggestionsTemplateParams = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

export default function SuggestionForm() {
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
      alert(`Failed to send feedback. Please try again later: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen flex justify-center px-3  md:pb-0 pb-12">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1 w-full">
            <label className="block text-sm font-bold mb-1">First Name</label>
            <input
              type="text"
              className="border border-gray-500 px-2 py-1 rounded-lg w-full bg-gray-100"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="col-span-1 w-full">
            <label className="block text-sm font-bold mb-1">Last Name</label>
            <input
              type="text"
              className="border border-gray-500 px-2 py-1 rounded-lg w-full bg-gray-100"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="w-full">
          <label className="block text-sm font-bold mb-1">Email</label>
          <input
            type="email"
            className="border border-gray-500 px-2 py-1 rounded-lg w-full bg-gray-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="w-full">
          <label className="block text-sm font-bold mb-1">Suggestion/ Feedback</label>
          <textarea
            rows={5}
            wrap="hard"
            maxLength={200}
            className="border border-gray-500 px-2 py-1 rounded-lg w-full h-32 max-h-44 min-h-[100px] bg-gray-100"
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
  );
}
