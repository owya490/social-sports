"use client";

import ContactUs from "@/components/Contact";
import SuggestionForm from "@/components/Suggestion";

export default function Suggestions() {
  return (
    <div className="w-screen h-screen flex flex-col md:flex-row items-center justify-center gap-4 p-4">
      <ContactUs />
      <div className="hidden md:block h-60 w-px bg-black mx-4" />
      <SuggestionForm />
    </div>
  );
}
