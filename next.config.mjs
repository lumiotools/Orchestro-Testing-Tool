/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix for Windows WASM hash issues
  webpack: (config, { dev, isServer }) => {
    // Use different hash function on Windows to avoid WASM issues
    if (process.platform === 'win32') {
      config.output.hashFunction = 'sha256'
    }
    return config
  },
  // Minimal config to avoid Windows path issues
  trailingSlash: false,
}

export default nextConfig
