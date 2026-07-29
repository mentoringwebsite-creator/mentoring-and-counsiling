/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => `build-${Date.now()}`,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        {
          key: 'Pragma',
          value: 'no-cache',
        },
        {
          key: 'Expires',
          value: '0',
        },
      ],
    },
  ],
  images: {
    unoptimized: true
  },
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        'node:fs': false,
        'node:https': false,
        'node:http': false,
        child_process: false,
        net: false,
        tls: false
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
    }
    return config;
  }
};

export default nextConfig;