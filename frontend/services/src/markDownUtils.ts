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
