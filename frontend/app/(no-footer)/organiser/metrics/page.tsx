import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import UnderConstruction from "@/components/UnderConstruction";

const MetricsPage = () => {
  return (
    <div>
      <div className="sm:ml-14 sm:mt-16">
        <div className="max-w-5xl lg:mx-auto">
          <OrganiserNavbar currPage="Metrics" />
          <UnderConstruction />
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;
