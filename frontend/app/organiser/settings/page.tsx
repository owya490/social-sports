import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import React from "react";

const page = () => {
  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar />
      <div className="p-10">
        <OrganiserSettingsStripeCard />
      </div>
    </div>
  );
};

export default page;
