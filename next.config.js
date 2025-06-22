/** @type {import('next').NextConfig} */
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
}

module.exports = nextConfig 