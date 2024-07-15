// pages/organiser/metrics.tsx

import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import coming_soon from "@/public/images/coming_soon.jpeg";
import Image from "next/image";

const MetricsPage = () => {
  return (
    <div className="ml-14 mt-16">
      <div className="max-w-5xl lg:mx-auto">
        <OrganiserNavbar currPage="Metrics" />
        <div className="flex-1 flex flex-col items-center justify-start p-10">
          <Image src={coming_soon} alt="Coming Soon" width={1000} height={1000}  />
        </div>
      </div>
    </div>
  );
};
export default MetricsPage;

// const UnderConstruction = () => {
//   return (
//     <div className="text-center text-5xl font-semibold flex justify-center px-20 py-[30vh]">
//       🚧 This page is still under construction 🚧
//     </div>
//   );
// };

// export default UnderConstruction;
