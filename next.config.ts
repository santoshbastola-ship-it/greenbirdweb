import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: true,
  register: true,
  skipWaiting: true,
});

import packageJson from './package.json';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default withPWA(nextConfig);
