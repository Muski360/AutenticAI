import type { NextConfig } from "next";
import { resolve } from "node:path";
import { clientConfig } from "../client-config.mjs";

const config = clientConfig({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  API_URL: process.env.NEXT_PUBLIC_API_URL,
});

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: { root: resolve(__dirname, "..") },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: config.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_URL: config.API_URL,
  },
  output: process.env.CLOUDFLARE_STATIC_EXPORT === "1" ? "export" : undefined,
};

export default nextConfig;
