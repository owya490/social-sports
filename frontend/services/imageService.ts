import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

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

export async function uploadUserImage(userID: string, file: File): Promise<string> {
    const timestamp = Date.now(); // To ensure unique filenames
    const imagePath = `users/${userID}/${timestamp}_${file.name}`;
    const imageRef = ref(storage, imagePath);

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


