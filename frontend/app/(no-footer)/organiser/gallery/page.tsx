"use client";
import { ImageGallery } from "@/components/gallery/ImageGallery";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
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
    <>
      <div className="max-w-5xl lg:mx-auto">
        <div className="px-4 md:px-0 mt-6">
          <h1 className="text-3xl font-bold text-core-text mb-2">Image Gallery</h1>
          <p className="text-gray-600 mb-4">
            Manage your event images and thumbnails. Upload new images with automatic cropping to the correct aspect
            ratios.
          </p>
          <ImageGallery user={user} />
        </div>
      </div>
    </>
  );
};

export default GalleryPage;
