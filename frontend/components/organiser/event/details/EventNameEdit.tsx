"use client";
import { CheckIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { Input } from "@material-tailwind/react";

import Skeleton from "react-loading-skeleton";

export const EventNameEdit = ({
  eventId,
  eventName,
  loading,
  isActive,
  updateData,
}: {
  eventId: string;
  eventName: string;
  loading: boolean;
  isActive: boolean;
  updateData: (id: string, data: any) => any;
}) => {
  const [editTitle, setEditTitle] = useState(false);
  const [newEditTitle, setNewEditTitle] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (eventName) {
      setTitle(eventName);
      setNewEditTitle(eventName);
    }
  }, [eventName]);

  const handleTitleUpdate = async () => {
    setTitle(newEditTitle);
    const nameTokens = newEditTitle.toLowerCase().split(" ");
    try {
      setEditTitle(false);
      await updateData(eventId, { name: newEditTitle, nameTokens });
    } catch (error) {
      console.error("Failed to update event name:", error);
    }
  };

  const handleTitleCancel = () => {
    setNewEditTitle(title);
    setEditTitle(false);
  };

  return (
    <div className="h-fit border-organiser-darker-light-gray px-4 pt-2 relative">
      <div className="text-organiser-title-gray-text font-bold">
        Event Name
        {loading ? (
          <Skeleton className="w-80 sm:w-[400px]" />
        ) : (
          <>
            {editTitle ? (
              <div className="flex my-1">
                <Input
                  value={newEditTitle}
                  style={{
                    fontSize: "1.5rem",
                    width: "100%",
                  }}
                  onChange={(e) => {
                    setNewEditTitle(e.target.value);
                  }}
                  crossOrigin="false"
                />
                <CheckIcon
                  className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                  onClick={() => {
                    handleTitleUpdate();
                  }}
                />
                <XMarkIcon
                  className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                  onClick={() => {
                    handleTitleCancel();
                  }}
                />
              </div>
            ) : (
              <div className="font-bold text-2xl my-1">
                {newEditTitle}
                {isActive && (
                  <PencilSquareIcon
                    className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => setEditTitle(true)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
