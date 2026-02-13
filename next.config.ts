import { join } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export output for static hosting
  output: "export",
  // Keep trailing slashes for exported files
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig; 