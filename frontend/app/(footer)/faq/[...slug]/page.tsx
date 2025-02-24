"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

// Utility function to extract content after a matching URL
const extractContentAfterUrl = (markdown: string, targetUrl: string): string => {
  const lines = markdown.split("\n").filter((line) => line.trim() !== ""); // Remove empty lines

  let contentAfterUrl: string[] = [];
  let foundMatchingUrl = false;

  for (const line of lines) {
    const isHeader = /^##\s/.test(line); // Detects `## Title`
    const match = line.match(/\[(.*?)\]\((.*?)\)/); // Detects Markdown links [text](url)

    if (foundMatchingUrl) {
      if (isHeader) break; // Stop collecting when a new `## Title` header is found
      contentAfterUrl.push(line);
    }

    if (match && match[2] === targetUrl) {
      foundMatchingUrl = true; // Start collecting lines after this URL
    }
  }

  return contentAfterUrl.join("\n"); // Return extracted content as a string
};

const FaqDetailPage = () => {
  console.log("why is this not wokring");
  const { slug } = useParams();
  const [faqContent, setFaqContent] = useState<string>("");
  const slugPath = `/${Array.isArray(slug) ? slug.join("/") : slug}`; // Construct URL
  useEffect(() => {
    fetch("/markdown_files/faq.md")
      .then((res) => res.text())
      .then((markdown) => {
        console.log("markdown", markdown);
        const extractedContent = extractContentAfterUrl(markdown, slugPath);
        setFaqContent(extractedContent);
        console.log("rerererererererererer", extractedContent);
      })
      .catch((err) => console.error("Error fetching FAQ:", err));
  }, [slug]);

  if (!faqContent) return <div className="text-center mt-10">FAQ not found.</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-4 mt-12">{slugPath.replace("/", "").replace(/-/g, " ")}</h1>
      <ReactMarkdown>{faqContent}</ReactMarkdown>
    </div>
  );
};

export default FaqDetailPage;
