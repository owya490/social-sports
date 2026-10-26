"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";

import {
  ensureActiveUserFromAuth,
  migrateTempUserToActiveUser,
} from "@/services/src/auth/authService";
import { getAuthPageHref, isProtectedRoute } from "@/services/src/auth/authNavigation";
import { isSocialAuthUser } from "@/services/src/auth/socialAuthUtils";
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
    let active = true;
    let authRevision = 0;
    const unsubscriber = onAuthStateChanged(auth, async (userAuth) => {
      const revision = ++authRevision;
      const isCurrent = () => active && revision === authRevision && auth.currentUser?.uid === userAuth?.uid;
      setUserLoading(true);
      if (userAuth?.emailVerified) {
        const { uid } = userAuth;
        try {
          let userData: UserData;
          if (isSocialAuthUser(userAuth)) {
            try {
              userData = await getFullUserByIdForUserContextWithRetries(uid as UserId);
            } catch {
              if (!isCurrent()) return;
              await ensureActiveUserFromAuth();
              if (!isCurrent()) return;
              userData = await getFullUserByIdForUserContextWithRetries(uid as UserId);
            }
          } else {
            await migrateTempUserToActiveUser(uid as UserId);
            if (!isCurrent()) return;
            userData = await getFullUserByIdForUserContextWithRetries(uid as UserId);
          }
          if (isCurrent()) setUser(userData);
        } catch {
          if (isCurrent()) {
            setUser(EmptyUserData as UserData);
            router.push("/error");
          }
        } finally {
          if (isCurrent()) setUserLoading(false);
        }
        return;
      }
      setUser(EmptyUserData as UserData);
      setUserLoading(false);
    });
    return () => {
      active = false;
      unsubscriber();
    };
  }, [router]);
  useEffect(() => {
    if (userLoading || !isProtectedRoute(pathname)) return;
    if (!auth.currentUser?.emailVerified) {
      const destination = window.location.pathname + window.location.search + window.location.hash;
      router.replace(getAuthPageHref("/login", destination));
    }
  }, [pathname, user.userId, userLoading, router]);

  return (
    <LoginUserContext.Provider value={{ userLoading, user, setUser, auth, refreshUser }}>
      {children}
    </LoginUserContext.Provider>
  );
}

export const useUser = () => useContext(LoginUserContext);
