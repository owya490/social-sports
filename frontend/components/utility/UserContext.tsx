"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData } from "../../interfaces/UserTypes";

import { getFullUserByIdForUserContextWithRetries } from "@/services/src/users/usersService";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);

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
      } 
      setLoading(false);
    });

    return () => unsubscriber();
  }, []);
  useEffect(() => {
    if (loading) return;
    console.log("first User", auth.currentUser)
    if (protectedRoutes.some((prefix) => pathname.startsWith(prefix))) {
      if (!auth.currentUser || !auth.currentUser?.emailVerified) {

        console.log("user", auth.currentUser);
        router.push("/login");
      }
    }
  }, [user, pathname, loading]);

  return <LoginUserContext.Provider value={{ user, setUser }}>{children}</LoginUserContext.Provider>;
}

export const useUser = () => useContext(LoginUserContext);
