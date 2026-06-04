/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  typedRoutes: true,
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;