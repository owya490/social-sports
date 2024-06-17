"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, authUser } from "@/services/src/firebase";
import { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // useEffect(() => {
  //   if (!loading && !user && pathname !== "/login") {
  //     router.push("/login"); // Redirect to login if not authenticated and not on the login page
  //   }
  // }, [user, pathname, loading]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
