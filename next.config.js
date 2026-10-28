/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
