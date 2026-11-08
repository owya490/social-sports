/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    FIREBASE_PROD_API_KEY: process.env.FIREBASE_PROD_API_KEY,
    FIREBASE_PROD_AUTH_DOMAIN: process.env.FIREBASE_PROD_AUTH_DOMAIN,
    FIREBASE_PROD_PROJECT_ID: process.env.FIREBASE_PROD_PROJECT_ID,
    FIREBASE_PROD_APP_ID: process.env.FIREBASE_PROD_APP_ID,
  },
};

module.exports = nextConfig;
