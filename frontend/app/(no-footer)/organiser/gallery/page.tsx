"use client";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";

const GalleryPage = () => {
  const { user } = useUser();

  if (!user.userId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="sm:ml-14 sm:mt-16">
        <div className="max-w-5xl lg:mx-auto">
          <OrganiserNavbar currPage="Gallery" />
          <div className="px-4 md:px-0 mt-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-core-text mb-2">Image Gallery</h1>
              <p className="text-gray-600">
                Manage your event images and thumbnails. Upload new images with automatic cropping to the correct aspect
                ratios.
              </p>
            </div>
            <ImageGallery user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
