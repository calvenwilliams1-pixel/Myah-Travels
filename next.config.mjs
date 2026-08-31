/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "friendly-waddle-qv76rx7rj564397p5-3000.app.github.dev"],
    },
  },
};

export default nextConfig;
