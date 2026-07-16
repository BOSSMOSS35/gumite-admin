import type { NextConfig } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "gumite-minio-sdsl.runixcloud.dev",
      },
      {
        protocol: "https",
        hostname: "gumite-image-cdn.bukhari-kibuka7.workers.dev",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/admin/:path*",
        destination: `${API_URL}/admin/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${API_URL}/ws/:path*`,
      },
      {
        source: "/store/:path*",
        destination: `${API_URL}/store/:path*`,
      },
    ];
  },
};

export default nextConfig;
