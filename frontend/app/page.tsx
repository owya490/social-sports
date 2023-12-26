import Image from "next/image";
import HeroImage from "./../public/images/home_hero.jpg";

export default function Home() {
  // redirect("/dashboard");
  return (
    <main className="mt-20 pb-10 w-[350px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
      <Image
        src={HeroImage}
        alt="hero"
        height={0}
        width={0}
        className="w-full object-cover h-screen"
      />
    </main>
  );
}
