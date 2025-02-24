"use client";
import Hero from "@/components/home/Hero";
import { parseMarkdown } from "@/services/src/markDownUtils";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const Faq = () => {
  const [faqContent, setFaqContent] = useState<string>("");
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  useEffect(() => {
    fetch("/markdown_files/faq.md")
      .then((response) => response.text())
      .then((text) => setFaqContent(text))
      .catch((error) => console.error("Error loading FAQ:", error));
  }, []);

  const faqItems = parseMarkdown(faqContent);

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  return (
    <div>
      <div className="mx-auto p-4 mt-12 max-w-6xl">
        <Hero />
      </div>
      <div className="mx-auto p-4 mt-12 max-w-4xl">
        <h1 className="text-center text-3xl font-bold mb-6 mt-12">Getting Started: Frequently Asked Questions</h1>
        <div className="space-y-4 mb-12">
          {faqItems.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleIndex(index)}
                className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
              >
                <span className="font-semibold">{item.question}</span>
                <span>{openIndices.includes(index) ? "▲" : "▼"}</span>
              </button>
              {openIndices.includes(index) && (
                <div className="p-4 bg-white border-t">
                  <ReactMarkdown
                    children={item.answer}
                    components={{
                      a: ({ href, children }) => (
                        <Link href={("faq/" + href) as string} className="text-blue-500 hover:underline">
                          {children}
                        </Link>
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Faq;
