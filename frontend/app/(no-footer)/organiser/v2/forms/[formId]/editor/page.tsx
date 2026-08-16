"use client";

import { FormEditor } from "@/components/organiser/v2/forms/editor/FormEditor";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

export default function OrganiserV2FormEditorPage() {
  const params = useParams<{ formId: string | string[] }>();
  const formId = (typeof params.formId === "string" ? params.formId : params.formId[0]) as FormId;

  return <FormEditor formId={formId} />;
}
