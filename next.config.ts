import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(:path*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://*.myshopify.com https://shopify.com;",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.devtunnels.ms", // Dev tunnel mapping
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;