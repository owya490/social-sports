"use client";
import { auth } from "@/services/src/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useLayoutEffect, useState } from "react";
import { EmptyUserData, LoadingUserData, UserData } from "../../interfaces/UserTypes";
import { getFullUserByIdForUserContextWithRetries } from "../../services/src/users/usersService";

import { createSession, removeSession } from "@/services/src/auth/cookiesService";
import { useRouter } from "next/navigation";

type LoginUserContextType = {
  user: UserData;
  isLoggedIn: () => boolean;
  logUserOut: () => void;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  user: EmptyUserData,
  isLoggedIn: () => false,
  logUserOut: () => {},
});

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(LoadingUserData);
  const router = useRouter();

  useLayoutEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { uid } = user;
        try {
          const userData = await getFullUserByIdForUserContextWithRetries(uid);
          setUser(userData);
          createSession(uid);
        } catch {
          router.push("/error");
        }
      } else {
        logUserOut();
        removeSession();
      }
    });
  }, []);

  function isLoggedIn(): boolean {
    return user.userId !== "";
  }

  function logUserOut() {
    setUser(EmptyUserData);
  }

  return <LoginUserContext.Provider value={{ user, isLoggedIn, logUserOut }}>{children}</LoginUserContext.Provider>;
}

export const useUser = () => useContext(LoginUserContext);
