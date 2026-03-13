import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  outputFileTracingRoot: path.join(process.cwd())
};

export default nextConfig;
