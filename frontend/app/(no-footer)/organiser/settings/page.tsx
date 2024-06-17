import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsAboutCard from "@/components/organiser/OrganiserSettingsAboutCard";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import React from "react";

const page = () => {
  return (
    <div className="ml-14 mt-16">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar currPage="Settings" />
        <div className="p-10 space-y-4">
          <OrganiserSettingsStripeCard />
          <OrganiserSettingsAboutCard />
        </div>
      </div>
    </div>
  );
};

export default page;
