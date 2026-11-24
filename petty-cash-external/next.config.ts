import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: [],
  experimental: {
    serverActions: { bodySizeLimit: '12mb' }
  }
};

export default config;
