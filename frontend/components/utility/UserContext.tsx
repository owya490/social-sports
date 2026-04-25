"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";

import { getTempUserData } from "@/services/src/auth/authService";
import { getFullUserByIdForUserContextWithRetries } from "@/services/src/users/usersService";
import { Auth, onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

type LoginUserContextType = {
  userLoading: boolean;
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  auth: Auth;
  refreshUser: () => Promise<void>;
};

export const LoginUserContext = createContext<LoginUserContextType>({
  userLoading: true,
  user: EmptyUserData as UserData,
  setUser: () => {},
  auth,
  refreshUser: async () => {},
});

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(EmptyUserData as UserData);
  const router = useRouter();
  const pathname = usePathname();
  const [userLoading, setUserLoading] = useState(true);

  const protectedRoutes = ["/organiser", "/profile", "/event/create"];
  const LoginRegisterRoutes = ["/register", "/login"];

  const refreshUser = async () => {
    if (!user.userId) {
      router.push("/error");
      return;
    }
    try {
      const userData = await getFullUserByIdForUserContextWithRetries(user.userId);
      setUser(userData);
    } catch {
      router.push("/error");
    }
  };

  useEffect(() => {
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      //need this because on user creation, if the user hasn't changed browsers since register
      // they might still have the firebase userobject, which after clicking the verify email,
      // will satify both the above conditions and then skip the create user workflow due to this
      // redirecting to dashboard, hence we need to do another check to see if they are in the create
      // user workflow
      setUserLoading(true);
      if (userAuth && userAuth.emailVerified) {
        const { uid } = userAuth;
        try {
          try {
            const userData = await getFullUserByIdForUserContextWithRetries(uid as UserId);
            setUser(userData);
          } catch {
            try {
              const tempUser = await getTempUserData(uid as UserId);
              if (!tempUser) {
                const onLoginOrRegister = LoginRegisterRoutes.some((prefix) => pathname.startsWith(prefix));
                if (onLoginOrRegister) {
                  setUser(EmptyUserData as UserData);
                } else {
                  router.push("/error");
                }
                return;
              }
              setUser(tempUser);
            } catch {
              router.push("/error");
              return;
            }
          }
        } finally {
          setUserLoading(false);
        }
        return;
      }
      setUserLoading(false);
    });
    return () => unsubscriber();
  }, [pathname, router]);
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
          const { uid } = auth.currentUser;
          try {
            const tempUser = await getTempUserData(uid as UserId);
            if (tempUser) return;
            if (user.userId === uid && user.userId !== "") {
              router.push("/");
              return;
            }
            if (pathname.startsWith("/login")) {
              router.push("/register");
            }
          } catch {
            router.push("/error");
          }
        }
      }
    };

    checkAuthStatus();
  }, [user, pathname, userLoading]);

  return (
    <LoginUserContext.Provider value={{ userLoading, user, setUser, auth, refreshUser }}>
      {children}
    </LoginUserContext.Provider>
  );
}

export const useUser = () => useContext(LoginUserContext);
