/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/tender/:id',
        destination: '/opportunites/:id',
        permanent: true,
      },
      {
        source: '/my-tenders',
        destination: '/mes-opportunites',
        permanent: true,
      },
      {
        source: '/my-tenders/:path*',
        destination: '/mes-opportunites/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
