"use client";

import FormEditor from "@/components/organiser/forms/FormEditor";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const FormEditorPage = () => {
  const params = useParams();
  const formId = (typeof params?.formId === "string" ? params.formId : params.formId[0]) as FormId;

  return (
    <>
      <FormEditor formId={formId} />
    </>
  );
};

export default FormEditorPage;
