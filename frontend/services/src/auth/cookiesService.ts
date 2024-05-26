"use server";
import { UserId } from "@/interfaces/UserTypes";
import { SESSION_COOKIE_NAME } from "@/utilities/constants";
import { isProduction } from "@/utilities/environment";
import { cookies } from "next/headers";

export async function createSession(userId: UserId) {
  cookies().set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: isProduction(),
    maxAge: 60 * 60 * 3, // 3 hours
    path: "/",
  });
}

export async function removeSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
