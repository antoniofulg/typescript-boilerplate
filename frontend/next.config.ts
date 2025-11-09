import type { NextConfig } from 'next';

// Default frontend alias
const DEFAULT_FRONTEND_ALIAS = 'voto-inteligente.frontend.local';
const FRONTEND_ALIAS = process.env.FRONTEND_ALIAS || DEFAULT_FRONTEND_ALIAS;

// Collect unique aliases for allowedDevOrigins
const allowedOrigins = new Set([DEFAULT_FRONTEND_ALIAS]);
if (FRONTEND_ALIAS && FRONTEND_ALIAS !== DEFAULT_FRONTEND_ALIAS) {
  allowedOrigins.add(FRONTEND_ALIAS);
}

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow cross-origin requests from frontend alias in development
  allowedDevOrigins: Array.from(allowedOrigins),
};

export default nextConfig;
