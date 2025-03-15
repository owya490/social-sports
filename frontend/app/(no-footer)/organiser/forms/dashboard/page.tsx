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
              <div className="hidden lg:block"></div>

              <div className="z-5 grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center px-4 min-w-[300px] lg:min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px] h-[68vh] lg:h-[80vh]">
                <div className="w-full">
                  <FormsCard formId="test" name="Form 1"></FormsCard>
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
