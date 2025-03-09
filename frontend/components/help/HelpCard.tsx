"use client";
import Link from "next/link";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";
import { useEffect, useState } from "react";
import { sleep } from "@/utilities/sleepUtil";
import LoadingSkeletonSmall from "../loading/LoadingSkeletonSmall";
import LoadingSkeletonHelpCard from "../loading/loadingSkeletonHelpCard";

interface HelpCardProps {
  thumbnail: string;
  title: string;
  selectedFolder: string;
  subFolder: string;
}

export default function HelpCard(props: HelpCardProps) {
  const { thumbnail, title, selectedFolder, subFolder } = props;
  const [loading, setLoading] = useState(true); // Start loading by default
  const [imageExists, setImageExists] = useState(false);
  const image = "/images/volleyball-art.png"; // Default image

  const checkImageExistence = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      console.error("Error checking image:", error);
      return false;
    }
  };

  useEffect(() => {
    if (thumbnail) {
      setLoading(true);
      checkImageExistence(thumbnail).then((exists) => {
        setImageExists(exists);

        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [thumbnail]);

  const cardContent = (
    <div className="bg-white text-left w-full flex flex-col rounded-lg shadow-md hover:cursor-pointer hover:scale-[1.02] transition-all duration-300">
      <Link href={`/help/${selectedFolder}/${subFolder}`}>
        {loading ? (
          <div className="w-full aspect-16/9">
            <LoadingSkeletonHelpCard />
          </div>
        ) : (
          <div
            className="w-full"
            style={{
              backgroundImage: `url(${imageExists && thumbnail ? thumbnail : image})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              aspectRatio: "16/9",
              borderRadius: "1rem",
            }}
          ></div>
        )}
        <p className="font-bold text-lg ml-1 mt-2 mb-4 flex">{title}</p>
      </Link>
    </div>
  );

  return cardContent;
}
