const os = require("os");

/** LAN IPv4s so a phone hitting this Mac over Wi-Fi can load /_next HMR. */
function getLanDevOrigins() {
  const origins = [];
  for (const addrs of Object.values(os.networkInterfaces())) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (!addr.internal && (addr.family === "IPv4" || addr.family === 4)) {
        origins.push(addr.address);
      }
    }
  }
  return origins;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js blocks /_next webpack-hmr from non-localhost origins unless listed.
  allowedDevOrigins: getLanDevOrigins(),
  env: {
    FIREBASE_DEV_API_KEY: process.env.FIREBASE_DEV_API_KEY,
    FIREBASE_DEV_AUTH_DOMAIN: process.env.FIREBASE_DEV_AUTH_DOMAIN,
    FIREBASE_DEV_DATABASE_URL: process.env.FIREBASE_DEV_DATABASE_URL,
    FIREBASE_DEV_PROJECT_ID: process.env.FIREBASE_DEV_PROJECT_ID,
    FIREBASE_DEV_STORAGE_BUCKET: process.env.FIREBASE_DEV_STORAGE_BUCKET,
    FIREBASE_DEV_MESSAGING_SENDER_ID: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
    FIREBASE_DEV_APP_ID: process.env.FIREBASE_DEV_APP_ID,
    FIREBASE_DEV_MEASUREMENT_ID: process.env.FIREBASE_DEV_MEASUREMENT_ID,
    FIREBASE_PROD_API_KEY: process.env.FIREBASE_PROD_API_KEY,
    FIREBASE_PROD_AUTH_DOMAIN: process.env.FIREBASE_PROD_AUTH_DOMAIN,
    FIREBASE_PROD_DATABASE_URL: process.env.FIREBASE_PROD_DATABASE_URL,
    FIREBASE_PROD_PROJECT_ID: process.env.FIREBASE_PROD_PROJECT_ID,
    FIREBASE_PROD_STORAGE_BUCKET: process.env.FIREBASE_PROD_STORAGE_BUCKET,
    FIREBASE_PROD_MESSAGING_SENDER_ID: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID,
    FIREBASE_PROD_APP_ID: process.env.FIREBASE_PROD_APP_ID,
    FIREBASE_PROD_MEASUREMENT_ID: process.env.FIREBASE_PROD_MEASUREMENT_ID,
    REACT_APP_EMAILJS_SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID,
    REACT_APP_EMAILJS_TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
    REACT_APP_EMAILJS_USER_ID: process.env.REACT_APP_EMAILJS_USER_ID,
    ENVIRONMENT: process.env.ENVIRONMENT,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.ENVIRONMENT,
    GOOGLE_MAPS_DEV_API_KEY: process.env.GOOGLE_MAPS_DEV_API_KEY,
    GOOGLE_MAPS_PROD_API_KEY: process.env.GOOGLE_MAPS_PROD_API_KEY,
  },
  images: {
    // Restricted to our own buckets so the optimiser cannot be used to spend our Vercel image quota on
    // arbitrary URLs. Prod pages also load the default sport thumbnails from the dev bucket.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/socialsportsprod.appspot.com/o/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/socialsports-44162.appspot.com/o/**",
      },
    ],
    // Kill switch: set NEXT_IMAGE_UNOPTIMIZED=true in Vercel and redeploy to serve original images again.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
    // Firebase download URLs are unique per upload, so optimised copies can be cached long-term. Without this,
    // the 4-hour default re-fetches from Firebase and re-bills a transformation for every image every 4 hours.
    minimumCacheTTL: 2678400,
    // WebP only: adding AVIF would double the transformations counted against the Vercel plan.
    formats: ["image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
      {
        source: "/event",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/organiser",
        destination: "/organiser/v2/dashboard",
        permanent: true,
      },
      {
        source: "/organiser/dashboard",
        destination: "/organiser/v2/dashboard",
        permanent: true,
      },
      {
        source: "/organiser/metrics",
        destination: "/organiser/v2/dashboard",
        permanent: true,
      },
      {
        source: "/organiser/gallery",
        destination: "/organiser/v2/gallery",
        permanent: true,
      },
      {
        source: "/organiser/settings",
        destination: "/organiser/v2/settings",
        permanent: true,
      },
      {
        source: "/organiser/event/:path*",
        destination: "/organiser/v2/event/:path*",
        permanent: true,
      },
      {
        source: "/organiser/forms/:path*",
        destination: "/organiser/v2/forms/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/blogs",
        destination: "/blogs/index.html",
      },
      {
        source: "/blogs/:slug+",
        destination: "/blogs/:slug+/index.html",
      },
      {
        source: "/docs",
        destination: "/docs/index.html",
      },
      {
        source: "/docs/:slug+",
        destination: "/docs/:slug+/index.html",
      },
    ];
  },
};

module.exports = nextConfig;
