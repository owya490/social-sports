"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import FormEditor from '@/components/organiser/forms/FormEditor';

const FormEditorPage = () => {
  const params = useParams();
  const formId = params?.formId;

  console.log('FormEditorPage params:', params); // Debugging line
  console.log('FormEditorPage formId:', formId); // Debugging line

  return (
    <div>
      <h1 className='my-10'>Form Editor Page</h1>
      <FormEditor formId={formId as string} />
    </div>
  );
};

export default FormEditorPage;