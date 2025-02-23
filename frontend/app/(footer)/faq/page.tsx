"use client";
import Hero from "@/components/home/Hero";
import { parseMarkdown } from "@/services/src/markDownUtils";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const Faq = () => {
  const [faqContent, setFaqContent] = useState<string>("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/markdown_files/faq.md")
      .then((response) => response.text())
      .then((text) => setFaqContent(text))
      .catch((error) => console.error("Error loading FAQ:", error));
  }, []);

  const faqItems = parseMarkdown(faqContent);
  console.log(faqItems);

  return (
    <div>
      <div className="mx-auto p-4 mt-12 max-w-6xl">
        <Hero />
      </div>
      <div className="mx-auto p-4 mt-12 max-w-4xl">
        <h1 className="text-center text-3xl font-bold mb-6 mt-12">Getting Started: frequently asked questions</h1>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
              >
                <span className="font-semibold">{item.question}</span>
                <span>{openIndex === index ? "▲" : "▼"}</span>
              </button>
              {openIndex === index && (
                <div className="p-4 bg-white border-t">
                  <ReactMarkdown
                    children={item.answer}
                    components={{
                      a: ({ href, children }) => (
                        // Here you can use Link instead of a regular anchor tag if the link is internal
                        <Link href={href as string} className="text-blue-500 hover:underline">
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
