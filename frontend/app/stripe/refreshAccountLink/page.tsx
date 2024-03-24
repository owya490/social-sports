"use client";
import { useUser } from "@/components/utility/UserContext";
import { getStripeStandardAccounLink } from "@/services/src/stripeService";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RefreshAccountLink() {
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    getStripeStandardAccounLink(user.userId, "http://localhost:3000/organiser").then((link) => {
      router.push(link);
    });
  }, []);
  return <></>;
}
