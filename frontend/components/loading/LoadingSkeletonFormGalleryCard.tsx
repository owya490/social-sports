import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonFormGalleryCard() {
  return (
    <div className="w-full h-80 sm:max-w-64 border border-core-outline rounded-lg overflow-hidden">
      <div className="h-60 bg-gray-50 p-4">
        <Skeleton height={32} width="80%" className="mb-4" />
        <Skeleton height={40} className="mb-3" />
        <Skeleton height={40} className="mb-3" />
        <Skeleton height={40} className="mb-3" />
      </div>

      <div className="h-20 bg-white border-t border-core-outline p-4">
        <Skeleton height={18} width="50%" />
        <Skeleton height={10} width="70%" />
      </div>
    </div>
  );
}
