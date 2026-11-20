"use client";

import { getClientAuth } from "@/lib/firebaseClient";
import { FirebaseConfigError } from "@/lib/firebaseConfig";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950";

async function openSession(user: User): Promise<string | null> {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (response.ok) {
    return null;
  }
  await signOut(getClientAuth());
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Sign-in could not be verified.";
}

function messageForAuthError(error: unknown): string {
  if (error instanceof FirebaseConfigError) {
    return error.message;
  }
  if (error instanceof FirebaseError) {
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      return "Email or password is incorrect.";
    }
    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Try again later.";
    }
    if (error.code === "auth/unauthorized-domain") {
      return "This domain is not authorized for sign-in yet.";
    }
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      return "";
    }
  }
  return "Sign-in failed. Try again.";
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function finish(user: User) {
    const failure = await openSession(user);
    if (failure) {
      setError(failure);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const credential = await signInWithEmailAndPassword(getClientAuth(), email, password);
      await finish(credential.user);
    } catch (caught) {
      const message = messageForAuthError(caught);
      if (message) {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setError("");
    setPending(true);
    try {
      const credential = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      await finish(credential.user);
    } catch (caught) {
      const message = messageForAuthError(caught);
      if (message) {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onGoogle}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        Continue with Google
      </button>
    </form>
  );
}
