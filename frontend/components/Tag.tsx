"use client";

export interface TagProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg";
  spacing?: boolean;
}

export default function Tag(props: TagProps) {
  let sizeStyle = "px-4 py-1 text-lg font-semibold";
  if (props.size === "sm") {
    sizeStyle = "px-2 py-0.5 text-sm m-1";
  } else if (props.size === "lg") {
    sizeStyle = "px-8 py-2 text-xl font-bold";
  }

  let spacing = "";
  if (props.spacing) {
    spacing = "mr-2 mb-2";
  }
  return (
    <button
      className={`flex sm:inline-flexs items-center overflow-hidden ${sizeStyle} ${spacing} border-black border bg-white hover:bg-black hover:text-white transition-all text-black text-center rounded-md whitespace-nowrap`}
      onClick={() => {
        window.open(props.url);
      }}
      style={{}}
    >
      {props.name}
    </button>
  );
}
