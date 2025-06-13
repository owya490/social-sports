import { TextSectionBuilder } from "@/components/forms/sections/text-section/TextSectionBuilder";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import React from "react";

const ViewForm = () => {
  return <div className="pt-[3.5rem]">
    <TextSectionBuilder/>
    <TextSectionResponse/>
  </div>;
};

export default ViewForm;
