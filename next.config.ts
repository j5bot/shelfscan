import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
    allowedDevOrigins: ['192.168.0.*'],
    serverExternalPackages: ['@undecaf/zbar-wasm'],
    images: {
        remotePatterns: [
            new URL('https://cf.geekdo-images.com/**'),
            new URL('https://cf.geekdo-static.com/**'),
            new URL('https://gameupc.com/assets/img/**'),
        ],
    },
    turbopack: {
        root: path.resolve(__dirname, './'),
    }
};

export default nextConfig;
