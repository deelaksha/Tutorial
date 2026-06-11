import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow viewing the dev server from the LAN IP
  allowedDevOrigins: ["192.168.100.174"],
};

export default nextConfig;
