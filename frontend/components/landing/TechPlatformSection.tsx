export default function TechPlatformSection() {
  return (
    <div className="w-screen flex justify-center py-24 bg-gray-50">
      <div className="screen-width-dashboard px-6 text-center">
        <h3 className="text-3xl md:text-4xl font-bold text-core-text mb-3">
          The world&apos;s first tech‑centric sports event platform
        </h3>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Built on a modern technologies to keep your events running with speed and reliability.
        </p>
        <div className="flex-col md:flex-row flex-wrap flex items-center justify-center gap-x-10 gap-y-6">
          <div className="flex items-center gap-x-10">
            <img src="/vercel.svg" alt="Vercel" className="h-6 w-auto" />
            <img src="/next.svg" alt="Next.js" className="h-6 w-auto" />
            <img src="/images/company-logos/firebase.svg" alt="Firebase" className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-x-10">
            <img src="/images/company-logos/google-maps.png" alt="Google Maps" className="h-6 w-auto" />
            <img src="/images/company-logos/stripe.png" alt="Stripe" className="h-6 w-auto" />
            <img src="/images/company-logos/loops.png" alt="Loops" className="h-6 w-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
