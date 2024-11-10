import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get("src") || "";
  console.log("hi", src);

  return new ImageResponse(
    (
      <div
        style={{
          color: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
        }}
      ></div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
