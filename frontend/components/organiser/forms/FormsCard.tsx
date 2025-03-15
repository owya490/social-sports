import { FormId } from "@/interfaces/FormTypes";
import React from "react";

export interface FormsCardProps {
  formId: FormId;
  name: string;
  loading?: boolean;
}

const FormsCard = (props: FormsCardProps) => {
  return (
    <div className="border-2">
      <>
        <div
          className="h-36 w-full object-cover rounded-t-lg"
          style={{
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        ></div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden">{props.name}</h2>
          <div className="mt-4 mb-5 space-y-3"></div>
          <div className="grid md:grid-cols-2"></div>
        </div>
      </>
    </div>
  );
};

export default FormsCard;
