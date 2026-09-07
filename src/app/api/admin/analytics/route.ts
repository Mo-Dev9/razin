import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { cairoDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // Total counts
    const [usersSnap, buildingsSnap, reviewsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('buildings').count().get(),
      db.collection('reviews').count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const totalBuildings = buildingsSnap.data().count;
    const totalReviews = reviewsSnap.data().count;

    // Reviews in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const [recent7Snap, recent30Snap, usersRecentSnap] = await Promise.all([
      db.collection('reviews').where('createdAt', '>=', sevenDaysAgo).count().get(),
      db.collection('reviews').where('createdAt', '>=', thirtyDaysAgo).count().get(),
      db.collection('users').where('createdAt', '>=', thirtyDaysAgo).count().get(),
    ]);

    // Reviews per day (last 14 Cairo days) for chart
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const reviewsSnap14 = await db
      .collection('reviews')
      .where('createdAt', '>=', fourteenDaysAgo)
      .orderBy('createdAt', 'asc')
      .get();

    const reviewsByDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const dayMs = Date.now() - i * 24 * 60 * 60 * 1000;
      reviewsByDay[cairoDateString(dayMs)] = 0;
    }
    reviewsSnap14.docs.forEach((doc) => {
      const date = cairoDateString(doc.data().createdAt || 0);
      if (reviewsByDay[date] !== undefined) reviewsByDay[date]++;
    });

    // Users who left comments (engagement rate)
    const reviewsWithComments = await db
      .collection('reviews')
      .where('comment', '!=', '')
      .count()
      .get();

    // Conversion rate: users with reviews / total unique user IDs in reviews
    const uniqueReviewerIds = new Set(
      (await db.collection('reviews').select('userId').get()).docs.map((d) => d.data().userId)
    );

    // Building with most reviews
    const topBuildingSnap = await db
      .collection('buildings')
      .orderBy('reviewCount', 'desc')
      .limit(5)
      .get();

    const topBuildings = topBuildingSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        address: data.address,
        area: data.area,
        city: data.city,
        reviewCount: data.reviewCount,
        overall: data.averageRatings?.overall || 0,
      };
    });

    // Visitor statistics
    const todayDate = cairoDateString();
    const visitDaysSnap = await db.collection('visitDays').get();
    const visitsByDay: Record<string, number> = {};
    const todayStart = new Date(`${todayDate}T00:00:00+02:00`).getTime();
    const sevenDaysStart = todayStart - 6 * 24 * 60 * 60 * 1000;
    const thirtyDaysStart = todayStart - 29 * 24 * 60 * 60 * 1000;
    let visitsToday = 0;
    let visitsLast7Days = 0;
    let visitsLast30Days = 0;

    visitDaysSnap.docs.forEach((doc) => {
      const count = doc.data().count || 0;
      if (count <= 0) return;
      const dayMs = new Date(`${doc.id}T00:00:00+02:00`).getTime();
      if (Number.isFinite(dayMs) && dayMs >= thirtyDaysStart) visitsLast30Days += count;
      if (Number.isFinite(dayMs) && dayMs >= sevenDaysStart) visitsLast7Days += count;
      if (doc.id === todayDate) visitsToday += count;
      visitsByDay[doc.id] = (visitsByDay[doc.id] || 0) + count;
    });

    const topPagesSnap = await db.collection('visitPages').orderBy('count', 'desc').limit(10).get();
    const topPages = topPagesSnap.docs.map((d) => {
      const data = d.data();
      return { path: data.path || d.id, count: data.count || 0 };
    });

    return NextResponse.json({
      totalUsers,
      totalBuildings,
      totalReviews,
      reviewsLast7Days: recent7Snap.data().count,
      reviewsLast30Days: recent30Snap.data().count,
      newUsersLast30Days: usersRecentSnap.data().count,
      uniqueReviewers: uniqueReviewerIds.size,
      reviewsWithComments: reviewsWithComments.data().count,
      engagementRate: totalReviews > 0 ? Math.round((reviewsWithComments.data().count / totalReviews) * 100) : 0,
      conversionRate: totalUsers > 0 ? Math.round((uniqueReviewerIds.size / totalUsers) * 100) : 0,
      reviewsByDay,
      topBuildings,
      visitsToday,
      visitsLast7Days,
      visitsLast30Days,
      visitsByDay,
      topPages,
    });
  } catch (err) {
    console.error('Admin analytics failed:', err);
    return NextResponse.json({ error: 'فشل جلب الإحصائيات' }, { status: 500 });
  }
}
