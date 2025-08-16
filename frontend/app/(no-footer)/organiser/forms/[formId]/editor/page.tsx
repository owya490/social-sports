"use client";

import FormEditor from "@/components/organiser/forms/FormEditor";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const FormEditorPage = () => {
  const params = useParams();
  const formId = params?.formId as FormId;

  return (
    <div>
      <FormEditor formId={formId} />
    </div>
  );
};

export default FormEditorPage;
