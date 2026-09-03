/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "friendly-waddle-qv76rx7rj564397p5-3000.app.github.dev",
        "friendly-waddle-qv76rx7rj564397p5-3001.app.github.dev",
      ],
    },
  },
};

export default nextConfig;
