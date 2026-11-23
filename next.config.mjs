/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baseline security headers on every response. Deliberately conservative:
  // the CSP only restricts framing, objects and base-tag hijacking, so it
  // cannot break the app's own scripts, styles or images.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
