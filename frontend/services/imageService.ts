import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

/*
Contract:
- Front-end needs to get the image urls when calling a function
- Images will be stored under the userID
- Figure out a way to fetch these images from the eventID
- Upon creating an event, a list of image URLS will be provided. Basically upon creation the user will select which images they want to use.
    - So this will require a way to get that list of image urls provided the userID
- Have a way to upload images for each user, so each user will have their own folder in Firebase Storage
- Have a way to delete images

*/

export async function getImageLocation(userID: string): Promise<string[]> {
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

export async function getDownloadUrls(userID: string): Promise<string[]> {
    const imageRefs = await getImageLocation(userID);
    try {
        // Map each image ref to a promise that resolves with its download URL
        const urlPromises = imageRefs.map((imageRef) => {
            const refPath = ref(storage, imageRef);
            return getDownloadURL(refPath);
        });

        // Wait for all promises to resolve
        const urls = await Promise.all(urlPromises);

        return urls;
    } catch (error) {
        console.error("Error fetching download URLs:", error);
        return [];
    }
}

// Need to implement image upload, below was working sort of.
// // const [imageUrl, setImageUrl] = useState<string | null>(null);
// const imageRef = ref(storage, "images/myImage.png");


// export function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];

//     if (file) {
//         // Upload the file to Firebase Storage
//         uploadBytes(imageRef, file)
//             .then((snapshot) => {
//                 console.log("Uploaded a file!");
//                 console.log(snapshot);
//             })
//             .catch((error) => {
//                 console.error("Upload failed:", error);
//             });
//     }
// };

