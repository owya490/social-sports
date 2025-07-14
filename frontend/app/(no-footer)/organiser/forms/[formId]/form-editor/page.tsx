"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import FormEditor from '@/components/organiser/forms/FormEditor';

const FormEditorPage = () => {
  
  const params = useParams();
  const formId = params?.formId as string;

  console.info('FormEditorPage params:', params); 
  console.info('FormEditorPage formId:', formId); 

  return (
    <div>
      <h1 className='my-10'></h1>
      <FormEditor formId={formId} />
    </div>
  );
};

export default FormEditorPage;
