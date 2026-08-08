"use client";

import { FormPreviewView } from "@/components/organiser/v2/forms/FormPreviewView";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

export default function OrganiserV2FormPreviewPage() {
  const params = useParams<{ formId: string | string[] }>();
  const formId = (typeof params.formId === "string" ? params.formId : params.formId[0]) as FormId;

  return <FormPreviewView formId={formId} />;
}
