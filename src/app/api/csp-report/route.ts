import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MAX_BODY = 8192;

/**
 * متلقي تقارير CSP (Report-Only حاليًا — قرار ٦): يلتقط انتهاكات سياسة المحتوى
 * في الفترة التجريبية دون إخفاق أي شيء، ويسجّلها للسجل (وSentry إن فُعّل) بدل
 * ضياعها. الخصوصية: لا يُخزَّن الجسد كاملًا — التفاصيل تُبسَّط ثم تُهمل؛
 * والترويسة تقوم بالقولبة أصلًا. لا يُراعى هذا المسار في السياسة لكونه مستقبلًا
 * التقارير نفسها (وسيُستثنى صراحةً عند التبديل لـ Enforce).
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const body = raw.length <= MAX_BODY ? raw : raw.slice(0, MAX_BODY);
    let parsed: { 'csp-report'?: Record<string, unknown> } | null = null;
    try {
      parsed = JSON.parse(body || '{}');
    } catch {
      parsed = null;
    }
    const report = parsed?.['csp-report'];
    const summary = report
      ? `uri=${report['document-uri'] ?? '?'} blocked=${report['blocked-uri'] ?? '?'} ` +
        `directive=${report['violated-directive'] ?? '?'} sourceFile=${report['source-file'] ?? ''}`
      : 'non-conforming csp report';
    console.warn('[csp-report-only]', summary);
  } catch (err) {
    console.warn('[csp-report] unreadable report:', err);
  }
  return NextResponse.json({ received: true });
}