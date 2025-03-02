"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toTitleCase } from "@/utilities/kebabToNormalCase";
import { FaArrowRightLong } from "react-icons/fa6";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HelpPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [subFolders, setSubFolders] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch("/api/help");
        const data = await res.json();
        setFolders(data);

        if (data.length > 0 && !selectedFolder) {
          setSelectedFolder(data[0]);
        }
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };

    fetchFolders();

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedFolder) {
      const fetchFolderData = async () => {
        try {
          const res = await fetch(`/api/help/${selectedFolder}`);
          const data = await res.json();

          setSubFolders(data.files); // Set subfolders (files in the folder)
          setMarkdownContent(data.markdownContent); // Set markdown content for the folder
        } catch (error) {
          console.error("Error fetching folder data:", error);
        }
      };

      fetchFolderData();
    }
  }, [selectedFolder]);

  return (
    <div className="mx-auto p-4 mt-12 max-w-4xl">
      <h1 className="text-center text-5xl font-bold mb-6 mt-12">Hi, how can we help?</h1>

      {isMobile ? (
        <div className="mb-4">
          <select
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="p-3 border rounded-lg w-full text-gray-800"
            value={selectedFolder || ""}
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {toTitleCase(folder)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ul className="flex space-x-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 mt-6">
            {folders.map((folder) => (
              <li key={folder}>
                <div
                  onClick={() => setSelectedFolder(folder)}
                  className={`inline-block px-6 py-4 rounded-t-lg cursor-pointer hover:bg-gray-100 ${
                    selectedFolder === folder ? "bg-gray-200 text-gray-800" : "text-gray-800"
                  }`}
                >
                  {toTitleCase(folder)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedFolder && markdownContent && (
        <div className="prose mt-6 pb-2 border-b border-gray-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        </div>
      )}

      {selectedFolder && (
        <div className="mt-6">
          <div className=" mt-4">
            {subFolders.length > 0 ? (
              subFolders.map((subFolder) => (
                <div key={subFolder}>
                  <Link
                    href={`/help/${selectedFolder}/${subFolder}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <span>{toTitleCase(subFolder)}</span>
                    {/* Right arrow icon */}
                    <FaArrowRightLong />
                  </Link>
                </div>
              ))
            ) : (
              <p>No subfolders found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
