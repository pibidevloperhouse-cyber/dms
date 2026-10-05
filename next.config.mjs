/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "localhost",
    "192.168.*.*",
    "10.11.208.137"
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