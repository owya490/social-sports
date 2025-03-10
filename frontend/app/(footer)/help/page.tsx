"use client";

import HelpCard from "@/components/help/HelpCard";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { toTitleCase } from "@/utilities/kebabToNormalCase";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function HelpPage() {
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [subFolders, setSubFolders] = useState<string[]>([]);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [subFolderloading, setSubFolderLoading] = useState(false);
  const [folderLoading, setfolderLoading] = useState(false);

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
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedFolder) {
      const fetchFolderData = async () => {
        try {
          setSubFolderLoading(true);
          const res = await fetch(`/api/help/${selectedFolder}`);
          const data = await res.json();
          console.log(data);
          setSubFolders(data.files);
          setMarkdownContent(data.markdownContent);
          setSubFolderLoading(false);
        } catch (error) {
          console.error("Error fetching folder data:", error);
        }
      };

      fetchFolderData();
    }
  }, [selectedFolder]);

  const getThumbnailPath = (subFolder: string) => {
    return `/markdown_files/help/${selectedFolder}/${subFolder}/thumbnail.jpg`; // Adjust the file name if needed
  };

  return (
    <div className="mx-auto p-4 mt-12 max-w-4xl">
      <h1 className="text-center text-5xl font-bold mb-6 sm:mt-12">Hi, how can we help?</h1>

      <div className="mb-4 sm:hidden">
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

      <div className="hidden sm:block overflow-x-auto text-sm font-medium text-center text-gray-500 border-b border-gray-200">
        <ul className="flex space-x-4 text-sm font-medium text-center border-b border-gray-200 mt-6">
          {folders.map((folder) => (
            <li key={folder}>
              <div
                className={`border-b-2 ${
                  selectedFolder === folder
                    ? "border-gray-900 rounded-t-lg text-gray-900 "
                    : "border-transparent text-gray-500 "
                }`}
              >
                <div
                  className="inline-block px-4 py-2 rounded my-1 cursor-pointer hover:text-gray-600 hover:bg-gray-200 w-full transition-colors"
                  onClick={() => setSelectedFolder(folder)}
                >
                  {toTitleCase(folder)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedFolder && markdownContent && (
        <div className="prose mt-6 pb-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        </div>
      )}

      {selectedFolder && (
        <div className="mt-6">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 w-full gap-x-4 gap-y-10">
            {subFolderloading ? (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-10">
                <LoadingSpinner />
              </div>
            ) : subFolders.length > 0 ? (
              subFolders.map((subFolder) => (
                <div key={subFolder}>
                  <HelpCard
                    title={toTitleCase(subFolder)}
                    selectedFolder={selectedFolder}
                    subFolder={subFolder}
                    thumbnail={getThumbnailPath(subFolder)}
                  />
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
