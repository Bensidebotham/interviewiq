import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Silence the workspace root warning caused by /Users/ben/package-lock.json
  outputFileTracingRoot: path.resolve(__dirname),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
}

export default nextConfig
