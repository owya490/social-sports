"use client";

import FormsCard from "@/components/organiser/forms/FormsCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import React, { useState, useEffect } from "react";

const FormsDashboard = () => {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    setForms([
      {
        formid: "test",
        image:
          "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2fbj2l4pt9b1gfjhaocvd9nj1cjfg3%2f1721045243251_screenshot%202024-07-08%20at%201.49.56%e2%80%afpm.png?alt=media&token=7920e1ba-5cd8-461d-8d51-9a43b80543a7",
        name: "form 1",
      },
      {
        formid: "test2",
        image:
          "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2fbj2l4pt9b1gfjhaocvd9nj1cjfg3%2f1721045243251_screenshot%202024-07-08%20at%201.49.56%e2%80%afpm.png?alt=media&token=7920e1ba-5cd8-461d-8d51-9a43b80543a7",
        name: "form 1",
      },
      {
        formid: "test2",
        image:
          "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2fbj2l4pt9b1gfjhaocvd9nj1cjfg3%2f1721045243251_screenshot%202024-07-08%20at%201.49.56%e2%80%afpm.png?alt=media&token=7920e1ba-5cd8-461d-8d51-9a43b80543a7",
        name: "form 1",
      },
    ]);
  }, []);

  return (
    <div className="w-screen pt-14 lg:pt-16 lg:pb-10 md:pl-7 h-fit max-h-screen overflow-y-auto">
      <OrganiserNavbar currPage={"FormsDashboard"} />
      <div className="flex justify-center">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl md:text-5xl lg:text-6xl my-6">Forms Dashboard</div>
            <div className="flex flex-row h-full w-full">
              <div className="z-5 grid grid-cols-1 xl:grid-cols-2 gap-6 justify-items-center px-4 min-w-[300px] lg:min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px] h-auto">
                {forms.map((form) => (
                  <FormsCard key={form.formId} formId={form.formId} image={form.image} name={form.name}></FormsCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsDashboard;
