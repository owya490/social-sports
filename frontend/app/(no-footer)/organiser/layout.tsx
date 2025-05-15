import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OrganiserNavbar />
    </>
  );
}
