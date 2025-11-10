"use client";
import { UserData } from "@/interfaces/UserTypes";
import { CameraIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProfilePhotoSelectionModal } from "./ProfilePhotoSelectionModal";

interface ProfilePhotoPanelProps {
  user: UserData;
  setUser: (user: UserData) => void;
}

export const ProfilePhotoPanel = ({ user, setUser }: ProfilePhotoPanelProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div className="flex items-center border border-core-outline p-6 rounded-lg space-x-4">
        <div
          className="relative h-32 w-32 lg:h-44 lg:w-44 rounded-full overflow-hidden cursor-pointer group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={user.profilePicture}
            alt={`${user.firstName} ${user.surname}'s profile picture`}
            width={176}
            height={176}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            priority
          />

          <div
            className={`absolute inset-0 flex items-center justify-center bg-black transition-opacity ${
              isHovered ? "bg-opacity-50" : "bg-opacity-0"
            }`}
          >
            {isHovered && (
              <div className="flex flex-col items-center text-white">
                <CameraIcon className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                <span className="text-sm font-medium">Change Photo</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <p className="text-lg font-semibold text-core-text">{`${user.firstName} ${user.surname}`}</p>
          {user.username && <p className="text-sm text-gray-600 mt-1">@{user.username}</p>}
          <Link href={`/user/${user.userId}`} className="text-sm text-core-text hover:underline mt-2 inline-block">
            View public profile →
          </Link>
        </div>
      </div>

      <ProfilePhotoSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        setUser={setUser}
      />
    </>
  );
};
