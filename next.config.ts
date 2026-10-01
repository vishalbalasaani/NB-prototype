import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "plenty-spill-dried.ngrok-free.dev",
  ],
  images: {
    qualities: [75, 90, 92],
  },
};

export default nextConfig;
