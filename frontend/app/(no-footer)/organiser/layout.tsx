import OrganiserShell from "@/components/organiser/OrganiserShell";

export default function OrganiserLayout({ children }: { children: React.ReactNode }) {
  return <OrganiserShell>{children}</OrganiserShell>;
}
