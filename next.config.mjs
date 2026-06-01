/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  typedRoutes: true,
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;