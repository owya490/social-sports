"use client";

export interface ITag {
  label: string;
  url?: string;
}

export default function Tag(props: ITag) {
  return (
    <button
      className="text-lg ml-3 mr-3 mb-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md "
      onClick={() => {
        window.open(props.url);
      }}
    >
      {props.label}
    </button>
  );
}
