import { Logger } from "@/observability/logger";
import { getDownloadURL, listAll, ref, StorageReference, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./firebase";

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
  switch (sport) {
    case "volleyball": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fvolleyball-default.jpg?alt=media&token=4bad4cf7-8d53-4bb5-a657-6d8ea871d6fd";
    }
    case "badminton": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbadminton-default.jpg?alt=media&token=187db12a-6e04-44da-aedc-04c5a1db99f7";
    }
    case "basketball": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbasketball-default.jpg?alt=media&token=3871475e-a25c-4fa0-bf3a-875241da48c4";
    }
    case "soccer": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fsoccer-default.jpg?alt=media&token=131621c2-8e69-4c90-b3fa-1d4522bcc700";
    }
    case "tennis": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Ftennis-default.jpg?alt=media&token=2dd4f5c1-30f0-4c9d-9dcf-72b40e7f14e1";
    }
    case "table-tennis": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Ftable-tennis-default.jpg?alt=media&token=2a07940e-b45e-4e19-b442-d1bbe8c69a35";
    }
    case "oztag": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Foztag-default.jpg?alt=media&token=acc4d712-398b-424b-bae2-0cafff22d0a4";
    }
    case "baseball": {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fbaseball-default.jpg?alt=media&token=c890c369-2793-44bb-b618-0b1e39cc64cc";
    }
    default: {
      return "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2FeventThumbnails%2Fthumbnail-default.jpg?alt=media&token=f58676d3-98b5-47c1-84ef-77dc38ed320e";
    }
  }
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
