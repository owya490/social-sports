import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSettingsAboutCard from "@/components/organiser/OrganiserSettingsAboutCard";
import OrganiserSettingsStripeCard from "@/components/organiser/OrganiserSettingsStripeCard";
import React from "react";

const page = () => {
  return (
    <div className="ml-14 mt-16">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar currPage="Settings" />
        <div className="p-12 space-y-8">
          <OrganiserSettingsStripeCard />
          {/* <OrganiserSettingsAboutCard /> */}
          <h1 className="pt-20 text-3xl font-bold text-center">More features coming soon!</h1>
        </div>
      </div>
    </div>
  );
};

export default page;
