import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganiserNavbar />
      <div className="sm:ml-14 px-2 pb-20 sm:p-4">{children}</div>
    </>
  );
}
