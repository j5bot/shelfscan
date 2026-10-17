import type { NextConfig } from "next";
import { withPostHogConfig } from '@posthog/nextjs-config';

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
        root: __dirname,
    }
};

// source maps are generated, uploaded to PostHog error tracking and then
// deleted from the build output; skipped when the upload credentials are absent
const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY ?? '';
const projectId = process.env.POSTHOG_PROJECT_ID ?? '';

export default withPostHogConfig(nextConfig, {
    personalApiKey,
    projectId,
    sourcemaps: {
        enabled: personalApiKey !== '' && projectId !== '',
        releaseName: 'shelfscan',
        releaseVersion: process.env.VERCEL_GIT_COMMIT_SHA,
        deleteAfterUpload: true,
    },
});
