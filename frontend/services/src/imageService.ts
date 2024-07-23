import { getDownloadURL, listAll, ref, StorageReference, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./firebase";

export async function getUsersImageLocation(userID: string): Promise<string[]> {
  const userRef = ref(storage, "users/" + userID);
  let itemArray: string[] = [];

  try {
    const res = await listAll(userRef);
    res.items.forEach((itemRef) => {
      itemArray.push(itemRef.fullPath);
    });
    return itemArray;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

export async function getUsersImageUrls(userID: string): Promise<string[]> {
  const imageRefs = await getUsersImageLocation(userID);
  try {
    const urlPromises = imageRefs.map((imageRef) => {
      const refPath = ref(storage, imageRef);
      return getDownloadURL(refPath);
    });

    const urls = await Promise.all(urlPromises);

    return urls;
  } catch (error) {
    console.error("Error fetching download URLs:", error);
    return [];
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
    console.error("Error fetching images:", error);
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
    console.error("Error fetching download URLs:", error);
    return [];
  }
}

export async function uploadProfilePhoto(userID: string, file: File): Promise<string> {
  const imagePath = `users/${userID}/profilepicture${generateImageId()}`;
  const imageRef = ref(storage, imagePath);
  const url = await uploadImage(imageRef, file);

  return url;
}

export async function uploadUserImage(userID: string, file: File): Promise<void> {
  const imagePath = `users/${userID}/${generateImageId()}`;
  const imageRef = ref(storage, imagePath);
  await uploadImage(imageRef, file);
}

async function uploadImage(imageRef: StorageReference, file: File): Promise<string> {
  try {
    // Upload the file to Firebase Storage
    await uploadBytes(imageRef, file);

    // Get the download URL of the uploaded file
    const url = await getDownloadURL(imageRef);

    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error; // Re-throw the error so the caller can handle it
  }
}

function generateImageId() {
  const timestamp = Date.now(); // To ensure unique filenames
  const uuid = uuidv4();

  return `${uuid}_${timestamp}`;
}
