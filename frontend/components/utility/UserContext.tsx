"use client";
import { auth } from "@/services/src/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData } from "../../interfaces/UserTypes";
import { getFullUserByIdForUserContextWithRetries } from "../../services/src/users/usersService";

import { useRouter } from "next/navigation";

type LoginUserContextType = {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  user: EmptyUserData,
  setUser: () => {},
});

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(EmptyUserData);
  const router = useRouter();

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth && auth.currentUser?.emailVerified) {
        const { uid } = userAuth;
        try {
          const userData = await getFullUserByIdForUserContextWithRetries(uid);
          setUser(userData);
        } catch {
          router.push("/error");
        }
      }
    });
    return () => unsubscriber();
  }, []);

  return <LoginUserContext.Provider value={{ user, setUser }}>{children}</LoginUserContext.Provider>;
}

export const useUser = () => useContext(LoginUserContext);
