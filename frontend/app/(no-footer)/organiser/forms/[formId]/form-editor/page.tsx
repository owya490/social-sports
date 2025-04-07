"use client";

import FormEditor from '@/components/organiser/forms/FormEditor';
import { useParams } from 'next/navigation';

const FormEditorPage = () => {
  const params = useParams();
  const formId = params?.formId;

  console.log('FormEditorPage params:', params); // Debugging line
  console.log('FormEditorPage formId:', formId); // Debugging line

  return <FormEditor formid={formId as string} />;
};

export default FormEditorPage;