"use client";

import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import { getSafeReturnTo } from "@/services/src/auth/authNavigation";
import { getTempUserData } from "@/services/src/auth/authService";
import { getFullUserById } from "@/services/src/users/usersService";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function useAuthPageNavigation() {
  const { auth, user, userLoading, setUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const manualSignInStarted = useRef(false);
  const operationUrl = useRef<string | null>(null);
  const navigated = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operationUrl.current = null;
    };
  }, [pathname, search]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (userLoading || manualSignInStarted.current || !currentUser?.emailVerified || user.userId !== currentUser.uid) {
      return;
    }

    let cancelled = false;
    const pageUrl = window.location.href;
    const isCurrent = () =>
      !cancelled && !manualSignInStarted.current && !navigated.current &&
      window.location.href === pageUrl && auth.currentUser?.uid === currentUser.uid &&
      auth.currentUser.emailVerified;

    void getTempUserData(currentUser.uid as UserId).then(
      (tempUser) => {
        if (!tempUser && isCurrent()) {
          navigated.current = true;
          router.replace(returnTo ?? "/");
        }
      },
      () => {
        if (isCurrent()) {
          navigated.current = true;
          router.replace("/error");
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [auth, user.userId, userLoading, pathname, search, returnTo, router]);

  const beginSignIn = () => {
    manualSignInStarted.current = true;
    operationUrl.current = window.location.href;
  };

  const completeSignIn = async (userId: UserId) => {
    const pageUrl = operationUrl.current;
    const isCurrent = () =>
      mounted.current && !navigated.current && pageUrl !== null &&
      pageUrl === operationUrl.current && window.location.href === pageUrl &&
      auth.currentUser?.uid === userId && auth.currentUser.emailVerified;

    if (!isCurrent()) return;
    const profile = await getFullUserById(userId);
    if (!isCurrent() || profile.userId !== userId) return;
    setUser(profile);
    navigated.current = true;
    router.replace(returnTo ?? "/?login=success");
  };

  return { returnTo, beginSignIn, completeSignIn };
}
