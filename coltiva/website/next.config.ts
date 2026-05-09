import type { NextConfig } from "next";

const COLTIVA_API_URL =
  process.env.NEXT_PUBLIC_COLTIVA_API_URL ?? "http://localhost:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${COLTIVA_API_URL}/api/v1/:path*`,
      },
    ];
  },
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
