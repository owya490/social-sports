"use client";

import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import { getSafeReturnTo } from "@/services/src/auth/authNavigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SignInAttempt = {
  url: string;
  userId?: UserId;
  finish?: () => void;
};

export function useAuthPageNavigation() {
  const { auth, user, userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const manualSignInStarted = useRef(false);
  const attempt = useRef<SignInAttempt | null>(null);
  const navigated = useRef(false);
  const mounted = useRef(true);
  const [completionRevision, setCompletionRevision] = useState(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      attempt.current?.finish?.();
      attempt.current = null;
    };
  }, [pathname, search]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    const currentAttempt = attempt.current;
    if (currentAttempt?.userId) {
      if (currentAttempt.url !== window.location.href || currentUser?.uid !== currentAttempt.userId || !currentUser.emailVerified) {
        currentAttempt.finish?.();
        attempt.current = null;
        return;
      }
      if (userLoading || user.userId !== currentAttempt.userId || navigated.current) return;
      navigated.current = true;
      router.replace(returnTo ?? "/?login=success");
      currentAttempt.finish?.();
      attempt.current = null;
      return;
    }

    if (userLoading || manualSignInStarted.current || navigated.current ||
        !currentUser?.emailVerified || user.userId !== currentUser.uid) return;

    navigated.current = true;
    router.replace(returnTo ?? "/");
  }, [auth, user.userId, userLoading, pathname, search, returnTo, router, completionRevision]);

  const beginSignIn = () => {
    manualSignInStarted.current = true;
    attempt.current?.finish?.();
    attempt.current = { url: window.location.href };
  };

  const completeSignIn = (userId: UserId): Promise<void> => {
    const currentAttempt = attempt.current;
    if (!mounted.current || navigated.current || !currentAttempt ||
        currentAttempt.url !== window.location.href || auth.currentUser?.uid !== userId ||
        !auth.currentUser.emailVerified) return Promise.resolve();

    return new Promise((finish) => {
      currentAttempt.userId = userId;
      currentAttempt.finish = finish;
      setCompletionRevision((revision) => revision + 1);
    });
  };

  return { returnTo, beginSignIn, completeSignIn };
}
