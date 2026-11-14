import type { NextConfig } from 'next';
import { normalizeBasePath } from './src/lib/asset-path';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH),
  poweredByHeader: false,
};
export default nextConfig;
