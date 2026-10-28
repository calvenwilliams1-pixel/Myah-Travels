/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "friendly-waddle-qv76rx7rj564397p5-3000.app.github.dev",
        "friendly-waddle-qv76rx7rj564397p5-3001.app.github.dev",
        "bookish-space-goldfish-qv76rx7rj5rw296jj.github.dev",
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // jsdom and its Node-only deps (undici → node:assert, fs, path, canvas)
      // are pulled in via CleanTipTapRenderer's lazy require("jsdom") inside
      // a runtime guard that webpack can't eliminate. Externals keeps them
      // out of the client bundle entirely.
      config.externals = [...(config.externals || []), "jsdom", "canvas"];
    }
    return config;
  },
};

export default nextConfig;
