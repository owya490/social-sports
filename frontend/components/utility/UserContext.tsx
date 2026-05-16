"use client";
import { auth } from "@/services/src/firebase";
import { createContext, useContext, useEffect, useState } from "react";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";

import { getTempUserData } from "@/services/src/auth/authService";
import { getFullUserByIdForUserContextWithRetries, skipProductOnboarding } from "@/services/src/users/usersService";
import {
  hasProvisionedFirestoreProfile,
  isNavigationAllowedDuringActiveOnboarding,
  isOnboardingExemptPath,
  needsAttendeeOnboarding,
  needsOnboardingPersonaChoice,
  needsOrganiserOnboarding,
  SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE,
} from "@/utilities/onboardingUtils";
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

function OnboardingLeaveGuard({ children }: { children: React.ReactNode }) {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (userLoading || !hasProvisionedFirestoreProfile(user)) return;

    const activeOnboarding =
      needsOnboardingPersonaChoice(user) || needsAttendeeOnboarding(user) || needsOrganiserOnboarding(user);
    if (!activeOnboarding) return;

    const onDocumentClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;

      let targetUrl: URL;
      try {
        targetUrl = new URL(anchor.href);
      } catch {
        return;
      }

      if (targetUrl.origin !== window.location.origin) return;

      const targetPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      const targetBase = targetUrl.pathname;

      if (targetBase === pathname) return;

      if (isNavigationAllowedDuringActiveOnboarding(targetBase, user)) return;

      e.preventDefault();
      e.stopPropagation();

      const confirmed = window.confirm(SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE);
      if (!confirmed) return;

      void (async () => {
        try {
          await skipProductOnboarding(user.userId as UserId);
          await refreshUser();
          router.push(targetPath);
        } catch {
          window.alert("Something went wrong leaving onboarding. Please try again.");
        }
      })();
    };

    document.addEventListener("click", onDocumentClickCapture, true);
    return () => document.removeEventListener("click", onDocumentClickCapture, true);
  }, [user, userLoading, pathname, router, refreshUser]);

  return <>{children}</>;
}

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
      //need this because on user creation, if the user hasn't changed browsers since register
      // they might still have the firebase userobject, which after clicking the verify email,
      // will satify both the above conditions and then skip the create user workflow due to this
      // redirecting to dashboard, hence we need to do another check to see if they are in the create
      // user workflow
      setUserLoading(true);
      if (userAuth && auth.currentUser?.emailVerified) {
        const { uid } = userAuth;
        try {
          try {
            const userData = await getFullUserByIdForUserContextWithRetries(uid as UserId);
            setUser(userData);
          } catch {
            try {
              const userData = await getTempUserData(uid as UserId);
              if (!userData) {
                router.push("/error");
                return;
              }
              setUser(userData);
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

  /** Keeps incomplete onboarding users in the funnel when history/back lands on a disallowed URL (link guard only catches <a> clicks). */
  useEffect(() => {
    if (userLoading) return;
    if (!auth.currentUser?.emailVerified) return;
    if (!hasProvisionedFirestoreProfile(user)) return;
    if (isOnboardingExemptPath(pathname)) return;

    const activeOnboarding =
      needsOnboardingPersonaChoice(user) ||
      needsAttendeeOnboarding(user) ||
      needsOrganiserOnboarding(user);
    if (!activeOnboarding) return;

    if (isNavigationAllowedDuringActiveOnboarding(pathname, user)) return;

    if (needsOnboardingPersonaChoice(user)) {
      router.replace("/onboarding");
      return;
    }
    if (needsAttendeeOnboarding(user)) {
      router.replace("/onboarding/attendee");
      return;
    }
    if (needsOrganiserOnboarding(user)) {
      router.replace("/onboarding/organiser");
    }
  }, [userLoading, pathname, user, router]);

  return (
    <LoginUserContext.Provider value={{ userLoading, user, setUser, auth, refreshUser }}>
      <OnboardingLeaveGuard>{children}</OnboardingLeaveGuard>
    </LoginUserContext.Provider>
  );
}
