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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="relative h-24 w-24 rounded-xl overflow-hidden border border-border group shrink-0"
          aria-label="Change profile photo"
        >
          <Image
            src={user.profilePicture}
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            priority
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/0 group-hover:bg-foreground/50 transition-colors">
            <CameraIcon className="h-6 w-6 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="mt-1 text-[10px] font-semibold text-background opacity-0 group-hover:opacity-100 transition-opacity font-sans">
              Change
            </span>
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground font-sans">Profile picture</p>
            <p className="mt-0.5 text-xs text-foreground-muted font-sans">
              JPG or PNG. Shown on your public profile and event pages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground font-sans hover:bg-surface-hover"
            >
              Upload
            </button>
            <Link
              href={`/user/${user.userId}`}
              className="text-xs font-semibold text-foreground-secondary hover:text-foreground font-sans"
            >
              View public profile →
            </Link>
          </div>
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
