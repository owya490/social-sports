"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/services/src/firebase"; // Ensure this import is correct
import { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import Loading from "@/components/loading/Loading";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const protectedRoutes = ["/organiser"]; // Add your protected routes here
  useEffect(() => {
    console.log("Setting up auth state change listener");
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        console.log("Auth state changed, user:", user);
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Error in auth state change:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up auth state change listener");
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    console.log("Checking authentication and protected routes");
    console.log("Current user:", user);
    console.log("Current pathname:", pathname);
    console.log("Loading:", loading);
    if (!loading && !user && protectedRoutes.some((prefix) => pathname.startsWith(prefix))) {
      console.log("why is this being triggered", user);
      router.push("/login");
    }
  }, [user, pathname, loading]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
