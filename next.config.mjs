import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: [
    "localhost",
    "192.168.*.*",
    "10.14.134.243",
  ],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dms',
        permanent: true,
      },
      {
        source: '/dms/tracker',
        destination: '/dms/marketplace/tracker',
        permanent: true,
      },
      {
        source: '/tasks',
        destination: '/deal-workflow',
        permanent: true,
      },
      {
        source: '/tasks/:path*',
        destination: '/deal-workflow',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;