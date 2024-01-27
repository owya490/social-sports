"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type LoginUserContextType = {
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  user: null,
  setUser: () => {},
});

type UserDocType = {
  profilePic: string;
  firstName: string;
  lastName: string;
  mobile: string;
  dob: string;
  location: string;
  sport: string;
};

type UserType = (UserDocType & { uid: string; email: string | null }) | null;

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserType>(null);

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      try {
        if (userAuth) {
          const { uid, email } = userAuth;
          const userDocRef = await doc(db, "Users", uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data() as UserDocType;
          setUser({
            uid,
            email,
            ...userData,
          });
        } else setUser(null);
      } catch (error) {
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

export const useUser = () => useContext(LoginUserContext);
