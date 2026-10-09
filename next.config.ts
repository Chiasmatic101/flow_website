import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/join', headers: [{ key: 'Referrer-Policy', value: 'same-origin' }, { key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/championship/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
    ]
  },
};

export default nextConfig;
