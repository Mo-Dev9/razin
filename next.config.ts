import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin'],
};

const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: "rentrate",
      project: "rentrate",
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { disable: true },
    })
  : nextConfig;
