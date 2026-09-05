"use client";

import { UserId } from "@/interfaces/UserTypes";
import { handleAppleSignIn, handleFacebookSignIn, handleGoogleSignIn } from "@/services/src/auth/authService";
import { useEffect, useTransition } from "react";

const SOCIAL_BUTTON_CLASS =
  "flex h-14 flex-1 items-center justify-center rounded-2xl border border-gray-300 bg-white transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-text disabled:cursor-not-allowed disabled:opacity-50";

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Continue with Google", signIn: handleGoogleSignIn, src: "/images/auth/google.png" },
  { id: "apple", label: "Continue with Apple", signIn: handleAppleSignIn, src: "/images/auth/apple.png" },
  { id: "facebook", label: "Continue with Facebook", signIn: handleFacebookSignIn, src: "/images/auth/facebook.png" },
] as const;

interface SocialAuthButtonsProps {
  disabled?: boolean;
  onError: (message: string) => void;
  onSuccess: (userId: UserId) => void | Promise<void>;
  onPendingChange?: (pending: boolean) => void;
}

export default function SocialAuthButtons({ disabled, onError, onSuccess, onPendingChange }: SocialAuthButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const buttonsDisabled = disabled || isPending;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const handleProviderClick = (signIn: () => Promise<UserId | null>) => {
    startTransition(async () => {
      try {
        const userId = await signIn();
        if (userId === null) {
          return;
        }
        await onSuccess(userId);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Social sign-in failed. Please try again.");
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-gray-400">or</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3" aria-busy={isPending}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className={SOCIAL_BUTTON_CLASS}
            aria-label={provider.label}
            disabled={buttonsDisabled}
            onClick={() => handleProviderClick(provider.signIn)}
          >
            <img src={provider.src} alt="" className="h-6 w-6 object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
}
