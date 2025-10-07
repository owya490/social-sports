import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganiserNavbar />
      <div className="pb-28 sm:ml-14 sm:pb-0">{children}</div>
    </>
  );
}
