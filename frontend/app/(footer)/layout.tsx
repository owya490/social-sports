import Footer from "@/components/Footer";

export const metadata = {
  title: "SPORTSHUB | Find your next social sport session!", 
  description: "Sportshub helps you find and book local sports events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
