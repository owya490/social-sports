import FormsCard from "@/components/organiser/forms/FormsCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import React from "react";

const FormsDashboard = () => {
  return (
    <div className="w-screen pt-14 lg:pt-16 lg:pb-10 md:pl-7 h-fit max-h-screen overflow-y-auto">
      <OrganiserNavbar currPage={"FormsDashboard"} />
      <div className="flex justify-center">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl md:text-5xl lg:text-6xl my-6">Forms Dashboard</div>
            <div className="flex flex-row h-full w-full">
              <div className="z-5 grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center px-4 min-w-[300px] lg:min-w-[600px] 2xl:min-w-[960px] 3xl:min-w-[1280px] h-[68vh] lg:h-[80vh]">
                <div className="w-full">
                  <FormsCard
                    formId="test"
                    image="https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2FbJ2L4Pt9B1gfjHaoCVD9nj1cjFG3%2F1721045243251_Screenshot%202024-07-08%20at%201.49.56%E2%80%AFPM.png?alt=media&token=7920e1ba-5cd8-461d-8d51-9a43b80543a7"
                    name="Form 1"
                  ></FormsCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsDashboard;
