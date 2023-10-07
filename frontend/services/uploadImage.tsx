import { storage } from "./firebase"
import { getStorage, ref } from "firebase/storage";

// Create a storage reference from our storage service
const imageRef = ref(storage, "images");


