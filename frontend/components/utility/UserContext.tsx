"use client";
import { auth } from "@/services/src/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData } from "../../interfaces/UserTypes";
import { getFullUserByIdForUserContextWithRetries } from "../../services/src/users/usersService";

import { redirect, usePathname, useRouter } from "next/navigation";

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
  const pathname = usePathname();

  const protectedRoutes = ["/organiser"];
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
      } else {
        router.replace("/login");
      }
    });

    return () => unsubscriber();
  }, []);

  useEffect(() => {
    console.log("Checking authentication and protected routes");
    console.log("Current user:", user);
    console.log("Current pathname:", pathname);

    if (user === EmptyUserData && protectedRoutes.some((prefix) => pathname.startsWith(prefix))) {
      console.log("why is this being triggered", user);
      router.push("/login");
    }
  }, [user, pathname]);

  return <LoginUserContext.Provider value={{ user, setUser }}>{children}</LoginUserContext.Provider>;
}

export const useUser = () => useContext(LoginUserContext);
