// app/api/help/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const helpFolderPath = path.join(process.cwd(), "public", "markdown_files", "help");
  try {
    const folders = fs
      .readdirSync(helpFolderPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json({ error: "Unable to fetch folders." }, { status: 500 });
  }
}
