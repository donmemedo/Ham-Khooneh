import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: { proxyClientMaxBodySize: "45mb" }, // listing uploads: up to 8 photos × 5 MB
  // browser calls /api/* on the same origin; proxied to FastAPI
  rewrites: async () => [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://localhost:8000"}/api/:path*` }],
};

export default nextConfig;
