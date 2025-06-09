import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="text-center">
        <h2 className="text-2xl">404 Not Found</h2>
        <p className="text-lg font-light mb-4">Sorry, what you were searching for could not be found...</p>
        <Link href="/dashboard" className="font-light underline cursor-pointer">
          Return Home
        </Link>
      </div>
    </div>
  );
}
