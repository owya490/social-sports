"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";

import { getTempUserData, resolveAuthenticatedUserData } from "@/services/src/auth/authService";
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

export const useUser = () => useContext(LoginUserContext);

export default function UserContext({ children }: { children: any }) {
  const [user, setUser] = useState<UserData>(EmptyUserData as UserData);
  const router = useRouter();
  const pathname = usePathname();
  const [userLoading, setUserLoading] = useState(true);

  const protectedRoutes = ["/organiser", "/profile", "/event/create", "/onboarding"];
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
      setUserLoading(true);
      if (userAuth && auth.currentUser?.emailVerified) {
        const { uid } = userAuth;
        try {
          const userData = await resolveAuthenticatedUserData(uid as UserId);
          setUser(userData);
        } catch {
          router.push("/error");
          return;
        } finally {
          setUserLoading(false);
        }
        return;
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
          const { uid } = auth.currentUser;
          try {
            const userData = await getTempUserData(uid as UserId);
            if (!userData) {
              router.push("/");
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
