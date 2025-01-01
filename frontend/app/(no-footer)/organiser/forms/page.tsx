"use client";
import { HighlightButton } from "@/components/elements/HighlightButton";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { createOrganiserForm } from "@/services/src/forms/formsService";

const FormsPage = () => {
  return (
    <div>
      <div className="sm:ml-14 sm:mt-16">
        <div className="max-w-5xl lg:mx-auto">
          <OrganiserNavbar currPage="Forms" />
          <div className="flex md:ml-4 lg:ml-0">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex flex-row items-center justify-center">
                <div className="text-4xl md:text-5xl lg:text-6xl my-6 ">Forms Dashboard</div>
              </div>
              <div className="flex flex-row h-full w-full">
                <HighlightButton
                  onClick={() => {
                    createOrganiserForm("");
                  }}
                >
                  Create Form
                </HighlightButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsPage;
