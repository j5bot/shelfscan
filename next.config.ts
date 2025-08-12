import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.0.*'],
    images: {
        remotePatterns: [
            new URL('https://cf.geekdo-images.com/**'),
            new URL('https://cf.geekdo-static.com/**'),
            new URL('https://gameupc.com/assets/img/**'),
        ],
    },
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/urlImports
    experimental: {
        urlImports: ['https://cdn.jsdelivr.net/'],
    },
};

export default nextConfig;
