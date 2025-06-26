/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable static file serving for audio files
  async rewrites() {
    return [
      {
        source: '/audio/:path*',
        destination: '/api/audio/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
}

module.exports = nextConfig 