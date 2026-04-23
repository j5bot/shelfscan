import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.0.*'],
    serverExternalPackages: ['@undecaf/zbar-wasm'],
    rewrites: async () => ([
        {
            source: '/bgg-images/:path*',
            destination: 'https://cf.geekdo-images.com/:path*',
        },
        {
            source: '/bgg-static/:path*',
            destination: 'https://cf.geekdo-static.com/:path*',
        },
        {
            source: '/gameupc-images/:path*',
            destination: 'https://gameupc.com/assets/img/:path*',
        },
    ]),
    images: {
        remotePatterns: [
            new URL('https://cf.geekdo-images.com/**'),
            new URL('https://cf.geekdo-static.com/**'),
            new URL('https://gameupc.com/assets/img/**'),
        ],
        minimumCacheTTL: 2678400, // 31 days
    },
    turbopack: {
        root: './'
    }
};

export default nextConfig;
