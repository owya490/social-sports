import { useAuth } from "@/auth/authContext";
import { useRouter } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) {
    router.push("/login");
  }
  return <html lang="en"></html>;
}
