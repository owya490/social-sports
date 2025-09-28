import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganiserNavbar />
      <div
        className="
        /* Mobile: Account for floating navbar with bottom padding */
        pb-24
        /* Desktop: Traditional sidebar margin */
        sm:ml-14 sm:pb-0
      "
      >
        {children}
      </div>
    </>
  );
}
