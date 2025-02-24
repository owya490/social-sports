export const parseMarkdown = (markdown: string) => {
  const sections = markdown.split(/\n## /).filter(Boolean); // Split on headers
  return sections.map((section) => {
    const lines = section.split("\n");
    const question = lines[0].replace("## ", ""); // Remove ## from question
    const answer = lines.slice(1).join("\n"); // Join remaining lines for the answer

    // Find any subtitles (e.g., '### Subtitle') and structure them
    const subtitles: string[] = [];
    const answerLines = answer
      .split("\n")
      .map((line) => {
        if (line.startsWith("### ")) {
          subtitles.push(line.replace("### ", "")); // Extract subtitle text
          return ""; // Remove subtitle from the answer content
        }
        return line;
      })
      .filter(Boolean); // Remove empty strings

    return {
      question,
      subtitles,
      answer: answerLines.join("\n"), // Reassemble the rest of the answer
    };
  });
};

export const extractHeaders = (markdown: string) => {
  const headerRegex = /^#\s+(.+)/gm; // Matches "# Title"
  const headers: { title: string; slug: string }[] = [];

  let match;
  while ((match = headerRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, ""); // Convert to URL-friendly slug
    headers.push({ title, slug });
  }

  return headers;
};

export const extractContentAfterUrl = (markdown: string, targetUrl: string): string => {
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
      foundMatchingUrl = true; // Start collecting lines after the matching URL
    }
  }

  return contentAfterUrl.join("\n"); // Return extracted content as a string
};
