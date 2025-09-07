import { SportConfig, SPORTS_CONFIG } from "@/config/SportsConfig";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getDownloadURL, listAll, ref, StorageReference, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./firebase";

export interface AllImageData {
  image: File | string | undefined;
  thumbnail: File | string | undefined;
}

export const imageServiceLogger = new Logger("imageServiceLogger");

export async function getUsersEventThumbnailsUrls(userID: string): Promise<string[]> {
  const userRef = ref(storage, "users/" + userID + "/eventThumbnails");

  try {
    const res = await listAll(userRef);
    const urls = res.items.map((itemRef) => {
      return getDownloadURL(itemRef);
    });
    return await Promise.all(urls);
  } catch (error) {
    imageServiceLogger.error(`Error fetching images ${error}`);
    return [];
  }
}

export async function getUsersEventImagesUrls(userID: string): Promise<string[]> {
  const userRef = ref(storage, "users/" + userID + "/eventImages");

  try {
    const res = await listAll(userRef);
    const urls = res.items.map((itemRef) => {
      return getDownloadURL(itemRef);
    });
    return await Promise.all(urls);
  } catch (error) {
    imageServiceLogger.error(`Error fetching images ${error}`);
    return [];
  }
}

export function getThumbnailUrlsBySport(sport: string) {
  const sportConfig: SportConfig = SPORTS_CONFIG[sport];
  if (sportConfig) {
    return sportConfig.defaultThumbnailUrl;
  }
  return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fthumbnail-default.jpg?alt=media&token=f58676d3-98b5-47c1-84ef-77dc38ed320e";
}

export async function uploadAndGetImageAndThumbnailUrls(userId: UserId, formData: AllImageData & { sport: string }) {
  // If the image field is undefined, it will stay as this default image.
  var imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-sports.jpeg?alt=media&token=045e6ecd-8ca7-4c18-a136-71e4aab7aaa5";
  // Otherwise if its a string, which means it is already uploaded, reuse the same imageUrl
  if (formData.image !== undefined && typeof formData.image === "string") {
    imageUrl = formData.image;
    // If the image field is a File, upload it
  } else if (formData.image !== undefined) {
    imageUrl = await uploadUserImage(userId, "/eventImages", formData.image);
  }

  var thumbnailUrl = getThumbnailUrlsBySport(formData.sport);

  // Otherwise if its a string, which means it is already uploaded, reuse the same imageUrl
  if (formData.thumbnail !== undefined && typeof formData.thumbnail === "string") {
    thumbnailUrl = formData.thumbnail;
    // If the image field is a File, upload it
  } else if (formData.thumbnail !== undefined) {
    thumbnailUrl = await uploadUserImage(userId, "/eventThumbnails", formData.thumbnail);
  }

  return [imageUrl, thumbnailUrl];
}

export async function getEventImageLocation(eventID: string): Promise<string[]> {
  const eventRef = ref(storage, "events/" + eventID);
  let itemArray: string[] = [];

  try {
    const res = await listAll(eventRef);
    res.items.forEach((itemRef) => {
      itemArray.push(itemRef.fullPath);
    });
    return itemArray;
  } catch (error) {
    imageServiceLogger.error(`Error fetching images ${error}`);
    return [];
  }
}

export async function getEventImageUrls(eventID: string): Promise<string[]> {
  const imageRefs = await getEventImageLocation(eventID);
  try {
    const urlPromises = imageRefs.map((imageRef) => {
      const refPath = ref(storage, imageRef);
      return getDownloadURL(refPath);
    });

    const urls = await Promise.all(urlPromises);

    return urls;
  } catch (error) {
    imageServiceLogger.error(`Error fetching download URLs ${error}`);
    return [];
  }
}

export async function uploadProfilePhoto(userID: string, file: File): Promise<string> {
  const imagePath = `users/${userID}/profilepicture${generateImageId()}`;
  const imageRef = ref(storage, imagePath);
  const url = await uploadImage(imageRef, file);

  return url;
}

export async function uploadUserImage(userID: string, path: string, file: File): Promise<string> {
  const imagePath = `users/${userID}${path}/${generateImageId()}`;
  const imageRef = ref(storage, imagePath);
  const url = await uploadImage(imageRef, file);

  return url;
}

async function uploadImage(imageRef: StorageReference, file: File): Promise<string> {
  try {
    // Upload the file to Firebase Storage
    await uploadBytes(imageRef, file);

    // Get the download URL of the uploaded file
    const url = await getDownloadURL(imageRef);

    return url;
  } catch (error) {
    imageServiceLogger.error(`Error uploading image ${error}`);
    throw error; // Re-throw the error so the caller can handle it
  }
}

function generateImageId(): string {
  const timestamp = Date.now(); // To ensure unique filenames
  const uuid = uuidv4();

  return `${uuid}_${timestamp}`;
}
