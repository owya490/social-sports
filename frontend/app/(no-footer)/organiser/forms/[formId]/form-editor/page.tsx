"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import FormEditor from '@/components/organiser/forms/FormEditor';

const FormEditorPage = () => {
  
  const params = useParams();
  const formId = params?.formId as string;

  console.log('FormEditorPage params:', params); // Debugging line
  console.log('FormEditorPage formId:', formId); // Debugging line

  return (
    <div>
      <h1 className='my-10'></h1>
      <FormEditor formId={formId} />
    </div>
  );
};

export default FormEditorPage;
