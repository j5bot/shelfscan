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
};

export default nextConfig;
