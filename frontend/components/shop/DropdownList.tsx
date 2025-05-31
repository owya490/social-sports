"use client";

import { useState } from "react";

export const DropdownList = ({ title, list }: { title: string; list: string[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4">
      <div className="flex items-center mb-1">
        <h4 className="text-sm font-body">{title}</h4>
        <button className="ml-auto text-xl mr-4 text-black font-light" onClick={() => setOpen(!open)}>
          {open ? "-" : "+"}
        </button>
      </div>
      {open && (
        <ol className="text-sm font-light space-y-1">
          {list.map((text, idx) => {
            return <li>{text}</li>;
          })}

        </ol>
      )}
      <div className="h-[1px] w-full bg-core-outline my-4"></div>
    </div>
  );
};
