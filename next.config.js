/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent firebase packages from being bundled into the SSR/Edge chunk.
  // They use browser APIs that crash during static pre-rendering on Cloudflare.
  serverExternalPackages: [
    'firebase',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

module.exports = nextConfig;
