import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";

export default function OrganiserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <OrganiserSidebar />
      <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
        <div className="pt-16 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
