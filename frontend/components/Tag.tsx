"use client";

export interface ITag {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg";
}

export default function Tag(props: ITag) {
  let sizeStyle = "px-4 py-1 text-lg font-semibold";
  if (props.size === "sm") {
    sizeStyle = "px-2 py-0.5 text-sm m-1";
  } else if (props.size === "lg") {
    sizeStyle = "px-8 py-2 text-xl font-bold";
  }
  return (
    <button
      className={`flex sm:inline-flexs items-center overflow-hidden ${sizeStyle} border-black border bg-white hover:bg-black hover:text-white transition-all text-black text-center rounded-md whitespace-nowrap`}
      onClick={() => {
        window.open(props.url);
      }}
      style={{}}
    >
      {props.name}
    </button>
  );
}
