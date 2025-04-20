"use client";
import { UserData } from "@/interfaces/UserTypes";
import Upload from "@/public/images/upload.png";
import { uploadProfilePhoto } from "@/services/src/imageService";
import { updateUser } from "@/services/src/users/usersService";
import imageCompression from "browser-image-compression";
import { deleteObject, getDownloadURL, getMetadata, getStorage, ref } from "firebase/storage";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

interface ProfilePhotoPanelProps {
  user: UserData;
  setUser: (user: UserData) => void;
  setEditedData: (user: any) => void;
}

export const ProfilePhotoPanel = ({ user, setUser, setEditedData }: ProfilePhotoPanelProps) => {
  const storage = getStorage();
  const defaultProfilePicturePath = "users/generic/generic-profile-photo.webp";

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Validate image type
  const validateImage = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchDefaultProfilePictureURL = async () => {
      try {
        const storageRef = ref(storage, defaultProfilePicturePath);
        const downloadURL = await getDownloadURL(storageRef);
        setEditedData((prevData: UserData) => ({
          ...prevData,
          profilePicture: prevData.profilePicture || downloadURL,
        }));
      } catch (error) {
        console.error("Error fetching default profile picture:", error);
      }
    };

    fetchDefaultProfilePictureURL();
  }, [defaultProfilePicturePath]);

  // Compress image before upload
  const handleImageUpload = async (imageFile: File) => {
    const options = {
      maxSizeMB: 2, // Maximum size of the image after compression
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);

      return compressedFile;
    } catch (error) {
      console.error("Error during image compression:", error);
      return null;
    }
  };

  // Handle file input change
  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    console.log(event);
    const files = event.target?.files;

    if (files && files.length > 0) {
      const file = files[0];

      if (validateImage(file)) {
        try {
          const previousProfilePictureURL = user.profilePicture;

          if (previousProfilePictureURL && !previousProfilePictureURL.includes("generic-profile-photo.webp")) {
            const previousProfilePictureRef = ref(storage, previousProfilePictureURL);

            try {
              await getMetadata(previousProfilePictureRef);
              await deleteObject(previousProfilePictureRef);
            } catch (error) {
              if ((error as any).code !== "storage/object-not-found") {
                console.error("Error deleting previous profile picture:", error);
              }
            }
          }

          // Compress the image before upload
          const compressedFile = await handleImageUpload(file);

          if (compressedFile) {
            const downloadURL = await uploadProfilePhoto(user.userId, compressedFile);

            updateUser(user.userId, {
              profilePicture: downloadURL,
            });

            setUser({ ...user, profilePicture: downloadURL });
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    }
  };

  return (
    <div className="flex border border-core-outline p-6 items-center justify-center rounded-lg space-x-3">
      <div
        className="relative transition duration-500 h-32 w-32 lg:h-44 lg:w-44 rounded-full overflow-hidden "
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={user.profilePicture}
          alt="DP"
          width={0}
          height={0}
          className="object-cover h-full w-full"
          onClick={() => {
            document.getElementById("Image_input")!.click();
          }}
        />
        <div className="absolute bottom-0 inset-x-0">
          <div className="flex items-center justify-center bg-black bg-opacity-50 text-white text-lg font-semibold py-2">
            Edit
          </div>
        </div>

        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center hover:cursor-pointer">
            <input
              type="file"
              id="Image_input"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".jpg,.jpeg,.png"
            />
            <Image
              src={Upload}
              alt="Upload"
              width={0}
              height={0}
              className="rounded-full object-cover h-30 w-30 opacity-60"
              onClick={() => {
                document.getElementById("Image_input")!.click();
              }}
            />
          </div>
        )}
      </div>
      <div>
        <p className="font-semibold lg:whitespace-no-wrap">{`${user.firstName} ${user.surname}`}</p>
        {user.username && <p className="text-xs font-thin">{user.username}</p>}
        <Link href={`/user/${user.userId}`} className="font-thin hover:underline text-xs">
          Go to public profile page.
        </Link>
      </div>
    </div>
  );
};
