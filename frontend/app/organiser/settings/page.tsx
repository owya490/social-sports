import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import React from "react";

const page = () => {
  return (
    <div className="ml-14 mt-16">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar />
        <div className="p-10">
          <OrganiserSettingsStripeCard />
        </div>
      </div>
    </div>
  );
};

export default page;
