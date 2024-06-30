import { auth } from "@/services/src/firebase";
import { createUser } from "@/services/src/users/usersService";
import { useEffect } from "react";

//store the email verification metadata in a temp firestore id.
export default function emailValidation () {
    useEffect(() => {
        if (auth.currentUser?.emailVerified) {
        //   createUser(data, userCredential.user.uid);
        }
    })
}