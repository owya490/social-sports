"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const LoginUserContext = createContext({});

// TODO: Add more fields of what you want to be in the context
type UserType = {
  uid: string;
  email: string | null;
} | null;

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      try {
        if (userAuth) {
          const { uid, email } = userAuth;
          const userDocRef = await doc(db, "Users", uid);
          const userDoc = await getDoc(userDocRef);
          setUser({ uid, email });
          if (userDoc.exists()) {
            console.log("Userdoc: ", userDoc.data());
            console.log("UserAuth Obj: ", userAuth);
          }
        } else setUser(null);
      } catch (error) {
        // Most probably a connection error. Handle appropriately.
        console.error(error);
      }
    });
    return () => unsubscriber();
  }, []);

  return (
    <LoginUserContext.Provider value={{ user, setUser }}>
      {children}
    </LoginUserContext.Provider>
  );
}

// Custom hook that shorthands the context!
export const useUser = () => useContext(LoginUserContext);
