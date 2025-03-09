"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

const MarkdownPage = () => {
  const params = useParams();
  const { category, slug } = params;

  const [content, setContent] = useState<string>("");
  useEffect(() => {
    if (!slug) return;

    fetch(`/markdown_files/help/${category}/${slug}/${slug}.md`)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Error loading markdown file:", err));
  }, [slug]);

  return (
    <div className="prose mx-auto p-4 mt-12 max-w-4xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => {
            if (!src) return null; // Avoid errors if src is undefined
            return <Image src={src} alt={alt || "Image"} width={1200} height={200} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPage;
