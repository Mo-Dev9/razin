import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  checks.projectId = projectId ? `✓ (${projectId})` : '✗ missing';
  checks.clientEmail = clientEmail ? `✓ (${clientEmail.slice(0, 20)}...)` : '✗ missing';
  checks.privateKey = privateKey
    ? `✓ (length: ${privateKey.length}, starts: ${privateKey.slice(0, 20)}..., hasNewlines: ${privateKey.includes('\\n')})`
    : '✗ missing';

  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snapshot = await db.collection('buildings').limit(1).get();
    checks.firestore = `✓ connected (${snapshot.size} docs in first page)`;
  } catch (err) {
    checks.firestore = `✗ ${(err as Error).message}`;
  }

  return NextResponse.json(checks);
}
