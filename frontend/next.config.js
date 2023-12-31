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
    },
    images: {
        domains: ["firebasestorage.googleapis.com"],
        unoptimized: true,
    },
};

module.exports = nextConfig;
