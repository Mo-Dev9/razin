import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { REPORT_REASONS } from '@/types';

interface RawReport {
  id: string;
  reviewId: string;
  buildingId: string;
  reason: string;
  status: string;
  createdAt: number;
  reporterUid: string;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    // newest first, then filtered to pending in memory (avoids a composite index)
    const snap = await db.collection('reports').orderBy('createdAt', 'desc').limit(100).get();
    const rawReports = snap.docs
      .map((d): RawReport => {
        const data = d.data();
        return { id: d.id, ...(data ?? {}) } as RawReport;
      })
      .filter((r) => r.status === 'pending');

    const reviewIds = [...new Set(rawReports.map((r) => r.reviewId))];
    const buildingIds = [...new Set(rawReports.map((r) => r.buildingId))];
    const reporterIds = [...new Set(rawReports.map((r) => r.reporterUid))];

    const reviewMap: Record<string, Record<string, unknown>> = {};
    const buildingMap: Record<string, Record<string, unknown>> = {};
    const reporterMap: Record<string, Record<string, unknown>> = {};

    await Promise.all([
      ...reviewIds.map(async (id) => {
        const d = await db.collection('reviews').doc(id).get();
        const data = d.data();
        if (d.exists && data) reviewMap[id] = data;
      }),
      ...buildingIds.map(async (id) => {
        const d = await db.collection('buildings').doc(id).get();
        const data = d.data();
        if (d.exists && data) buildingMap[id] = data;
      }),
      ...reporterIds.map(async (id) => {
        const d = await db.collection('users').doc(id).get();
        const data = d.data();
        if (d.exists && data) reporterMap[id] = data;
      }),
    ]);

    const reports = rawReports.map((r) => ({
      id: r.id,
      reviewId: r.reviewId,
      buildingId: r.buildingId,
      reason: r.reason,
      reasonLabel: REPORT_REASONS.find((x) => x.id === r.reason)?.ar || r.reason,
      createdAt: r.createdAt,
      reporterUid: r.reporterUid,
      reporterName: (reporterMap[r.reporterUid]?.displayName as string) || '—',
      reporterEmail: (reporterMap[r.reporterUid]?.email as string) || '',
      reportAnonymous: reporterMap[r.reporterUid]?.isAnonymous !== false,
      reviewComment: (reviewMap[r.reviewId]?.comment as string) || '',
      reviewOverall: (reviewMap[r.reviewId]?.overall as number) ?? 0,
      buildingAddress: (buildingMap[r.buildingId]?.address as string) || r.buildingId,
    }));

    return NextResponse.json({ reports });
  } catch (err) {
    console.error('Admin get reports failed:', err);
    return NextResponse.json({ error: 'فشل جلب البلاغات' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { reportId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { reportId } = body;
  if (!reportId) {
    return NextResponse.json({ error: 'reportId مطلوب' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const reportRef = db.collection('reports').doc(reportId);
    const reportSnap = await reportRef.get();
    if (!reportSnap.exists) {
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
    }

    await reportRef.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin dismiss report failed:', err);
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }
}