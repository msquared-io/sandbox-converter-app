import type { NextConfig } from "next";

/**
 * Next.js configuration with specific handling for Sharp in server components
 */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Properly handle Sharp in server components
    if (isServer) {
      // Use the direct externals approach to resolve Sharp
      if (!config.externals) {
        config.externals = [];
      }

      // Make Sharp an external module to use the installed version directly
      const sharpExternal = /^sharp$/;
      if (Array.isArray(config.externals)) {
        config.externals.push(sharpExternal);
      } else {
        config.externals = [...(config.externals || []), sharpExternal];
      }
    }

    return config;
  },
} as NextConfig;

export default nextConfig;
