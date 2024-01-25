"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { EmptyUserData, UserData, UserId } from "../../interfaces/UserTypes";
import { getUserById } from "../../services/usersService";

type LoginUserContextType = {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  user: EmptyUserData,
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

export type UserType = (UserData & { uid: string; email: string | null }) | null;

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(EmptyUserData);

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      try {
        if (userAuth) {
          const { uid, email } = userAuth;
          // const userDocRef = await doc(db, "Users", uid);
          // const userDoc = await getDoc(userDocRef);
          // const userData = userDoc.data() as UserDocType;
          const userData = getUserById(uid).then((data) => {
            console.log("owen");
            console.log(data);
            setUser({
              ...data
            })
            console.log({
              uid, email, ...data
            })
          })
          // setUser({
          //   uid,
          //   email,
          //   ...userData,
          // });
        };
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
