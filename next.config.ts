import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
import type { Configuration } from 'webpack'

module.exports = {
  webpack: (
    config: Configuration,
    { isServer }: { isServer: boolean }
  ) => {
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false
      }
    }
    return config
  }
}