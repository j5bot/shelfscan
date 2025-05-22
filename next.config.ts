import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [new URL('https://cf.geekdo-images.com/**')],
    },
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/urlImports
    experimental: {
        urlImports: ['https://cdn.jsdelivr.net/'],
    },
};

export default nextConfig;
