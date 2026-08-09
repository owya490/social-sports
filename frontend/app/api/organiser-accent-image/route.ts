import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["firebasestorage.googleapis.com"]);

/**
 * Same-origin proxy for organiser profile photos so the hub can sample pixels.
 * Firebase Storage download URLs do not send Access-Control-Allow-Origin on GET,
 * which taints canvas / fails cross-origin Image loads in the browser.
 */
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");
  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString(), { cache: "force-cache" });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Not an image" }, { status: 400 });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
