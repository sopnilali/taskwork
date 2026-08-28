import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['sql.js'],
    experimental: {
        serverActions: {},
    },
};

export default nextConfig;
