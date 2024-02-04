/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    FIREBASE_DEV_API_KEY: process.env.FIREBASE_DEV_API_KEY,
    FIREBASE_DEV_AUTH_DOMAIN: process.env.FIREBASE_DEV_AUTH_DOMAIN,
    FIREBASE_DEV_DATABASE_URL: process.env.FIREBASE_DEV_DATABASE_URL,
    FIREBASE_DEV_PROJECT_ID: process.env.FIREBASE_DEV_PROJECT_ID,
    FIREBASE_DEV_STORAGE_BUCKET: process.env.FIREBASE_DEV_STORAGE_BUCKET,
    FIREBASE_DEV_MESSAGING_SENDER_ID:
      process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
    FIREBASE_DEV_APP_ID: process.env.FIREBASE_DEV_APP_ID,
    FIREBASE_DEV_MEASUREMENT_ID: process.env.FIREBASE_DEV_MEASUREMENT_ID,
    FIREBASE_PROD_API_KEY: process.env.FIREBASE_PROD_API_KEY,
    FIREBASE_PROD_AUTH_DOMAIN: process.env.FIREBASE_PROD_AUTH_DOMAIN,
    FIREBASE_PROD_PROJECT_ID: process.env.FIREBASE_PROD_PROJECT_ID,
    FIREBASE_PROD_STORAGE_BUCKET: process.env.FIREBASE_PROD_STORAGE_BUCKET,
    FIREBASE_PROD_MESSENGING_SENDER_ID:
      process.env.FIREBASE_PROD_MESSENGING_SENDER_ID,
    FIREBASE_PROD_APP_ID: process.env.FIREBASE_PROD_APP_ID,
    FIREBASE_PROD_MEASUREMENT_ID: process.env.FIREBASE_PROD_MEASUREMENT_ID,
    ENVIRONMENT: process.env.ENVIRONMENT,
  },
  images: {
    domains: ["firebasestorage.googleapis.com"],
    unoptimized: true,
  },
  // https://github.com/open-telemetry/opentelemetry-js/issues/4173#issuecomment-1822938936 to prevent console spamming for
  // Open Telemetry Critical Dependency: the request of a dependency is an expression.
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    if (isServer) {
      config.ignoreWarnings = [{ module: /opentelemetry/ }];
    }
    return config;
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
