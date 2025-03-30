import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { folder: string } }) {
  const folderName = params.folder; // Extract 'folder' parameter from URL
  const helpFolderPath = path.join(process.cwd(), "public", "markdown_files", "help", folderName);

  try {
    // Read the contents of the specific folder
    const files = fs.readdirSync(helpFolderPath);

    // Filter out only subfolders (directories)
    const subfolders = files.filter((file) => {
      const filePath = path.join(helpFolderPath, file);
      return fs.statSync(filePath).isDirectory(); // Check if the file is a directory
    });

    // Fetch the markdown content for the folder (e.g., folderName.md)
    const markdownFilePath = path.join(helpFolderPath, `${folderName}.md`);
    let markdownContent = null;

    // Check if the markdown file exists and read it
    if (fs.existsSync(markdownFilePath)) {
      markdownContent = fs.readFileSync(markdownFilePath, "utf-8");
    }

    // Return both subfolders and markdown content
    return NextResponse.json({
      files: subfolders, // List of subfolders
      markdownContent, // Markdown content for the selected folder
    });
  } catch (error) {
    console.error("Error fetching folder contents:", error);
    return NextResponse.json({ error: `Unable to fetch contents of ${folderName}` }, { status: 500 });
  }
}
