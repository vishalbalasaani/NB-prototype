import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "plenty-spill-dried.ngrok-free.dev",
  ],
  images: {
    qualities: [75, 90, 92],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
