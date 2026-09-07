import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
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
