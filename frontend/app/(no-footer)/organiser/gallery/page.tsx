import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import UnderConstruction from "@/components/UnderConstruction";

const GalleryPage = () => {
  return (
    <div>
      <div className="sm:ml-14 sm:mt-14">
        <div className="max-w-5xl lg:mx-auto">
          <OrganiserNavbar currPage="Gallery" />
          <UnderConstruction />
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
