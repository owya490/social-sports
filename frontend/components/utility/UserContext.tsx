"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData } from "../../interfaces/UserTypes";

import { getTempUserData } from "@/services/src/auth/authService";
import { getFullUserByIdForUserContextWithRetries } from "@/services/src/users/usersService";
import { Auth, onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

type LoginUserContextType = {
  userLoading: boolean;
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  auth: Auth;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  userLoading: true,
  user: EmptyUserData,
  setUser: () => {},
  auth,
});

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(EmptyUserData);
  const router = useRouter();
  const pathname = usePathname();
  const [userLoading, setUserLoading] = useState(true);

  const protectedRoutes = ["/organiser", "/profile"];
  const LoginRegisterRoutes = ["/register", "/login"];
  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      //need this because on user creation, if the user hasn't changed browsers since register
      // they might still have the firebase userobject, which after clicking the verify email,
      // will satify both the above conditions and then skip the create user workflow due to this
      // redirecting to dashboard, hence we need to do another check to see if they are in the create
      // user workflow
      setUserLoading(true);
      if (userAuth && auth.currentUser?.emailVerified) {
        const { uid } = userAuth;
        try {
          const userData = await getFullUserByIdForUserContextWithRetries(uid);
          setUser(userData);
        } catch {
          const userData = await getTempUserData(auth.currentUser.uid);
          if (!userData) {
            router.push("/error");
          }
        }
      }
      setUserLoading(false);
    });
    return () => unsubscriber();
  }, []);
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (userLoading) return;

      if (protectedRoutes.some((prefix) => pathname.startsWith(prefix))) {
        if (!auth.currentUser || !auth.currentUser.emailVerified) {
          router.push("/login");
        }
      }

      if (LoginRegisterRoutes.some((prefix) => pathname.startsWith(prefix))) {
        if (auth.currentUser && auth.currentUser.emailVerified) {
          //need this because on user creation, if the user hasn't changed browsers since register
          // they might still have the firebase userobject, which after clicking the verify email,
          // will satify both the above conditions and then skip the create user workflow due to this
          // redirecting to dashboard, hence we need to do another check to see if they are in the create
          // user workflow
          const userData = await getTempUserData(auth.currentUser.uid);
          console.log("userData", userData);
          if (!userData) {
            router.push("/dashboard");
          }
        }
      }
    };

    checkAuthStatus();
  }, [user, pathname, userLoading]);

  return <LoginUserContext.Provider value={{ userLoading, user, setUser, auth }}>{children}</LoginUserContext.Provider>;
}

export const useUser = () => useContext(LoginUserContext);
