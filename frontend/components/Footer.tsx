import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-800 border-t-[1px] border-gray-700 py-8 px-4 md:px-8 lg:px-16 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Column 1: Company */}
        <div>
          <h4 className="font-bold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/aboutUs" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Organiser */}
        <div>
          <h4 className="font-bold text-white mb-4">Organiser</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/organiser/dashboard" className="hover:text-white">
                Organiser Hub
              </Link>
            </li>
            <li>
              <Link href="/event/create" className="hover:text-white">
                Create Event
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Featured Locations */}
        <div>
          <h4 className="font-bold text-white mb-4">Featured Locations</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/featured/sydney/volleyball" className="hover:text-white">
                Sydney Volleyball
              </Link>
            </li>
            <li>
              <Link href="/featured/sydney/badminton" className="hover:text-white">
                Sydney Badminton
              </Link>
            </li>
            <li>
              <Link href="/featured/sydney/social_sports" className="hover:text-white">
                Sydney Social Sports
              </Link>
            </li>
            {/* Add more featured locations here as needed */}
          </ul>
        </div>

        {/* Column 4: Resources */}
        <div>
          <h4 className="font-bold text-white mb-4">Resources</h4>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link href="/blogs" className="hover:text-white">
                Blogs
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-white">
                Docs
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-600 text-center text-sm text-gray-400">
        © {currentYear} SPORTSHUB. All rights reserved.
      </div>
    </footer>
  );
}
