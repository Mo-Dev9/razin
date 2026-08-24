import * as Sentry from '@sentry/nextjs';
import type { NextRequest } from 'next/server';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    require('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    require('../sentry.edge.config');
  }
}

export function onRequestError(
  error: Error,
  info: { componentStack?: string; digest?: string; serverComponent?: unknown }
) {
  Sentry.captureException(error, {
    extra: {
      componentStack: info.componentStack,
      digest: info.digest,
    },
  });
}
