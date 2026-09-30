/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "localhost",
    "192.168.*.*",
  ],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dms',
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