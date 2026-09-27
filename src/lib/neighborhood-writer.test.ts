import { describe, it, expect } from 'vitest';
import { isMonthlyListing, shouldMarkReady } from '@/lib/neighborhood-writer';
import { MIN_DISPLAY_SOURCES } from '@/lib/price-stats';

describe('isMonthlyListing', () => {
  it('يقبل null (بلا تردد = شهري افتراضيًا)', () => {
    expect(isMonthlyListing({ rentalFrequency: null })).toBe(true);
    expect(isMonthlyListing({})).toBe(true);
  });

  it('يقبل شهري تحديدًا', () => {
    expect(isMonthlyListing({ rentalFrequency: 'monthly' })).toBe(true);
  });

  it('يرفض يومي/أسبوعي/سنوي', () => {
    expect(isMonthlyListing({ rentalFrequency: 'daily' })).toBe(false);
    expect(isMonthlyListing({ rentalFrequency: 'weekly' })).toBe(false);
    expect(isMonthlyListing({ rentalFrequency: 'yearly' })).toBe(false);
  });
});

describe('shouldMarkReady — الحارس الجغرافي', () => {
  it('يختم ready لمفتاح رسمي كافٍ بالإعلانات', () => {
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'المقطم')).toBe(true);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'مدينهنصر')).toBe(true);
  });

  it('لا يختم ready لمفتاح مشوّه مهما بلغ عدد الإعلانات', () => {
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'boulaqdakrour')).toBe(false);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'katameya')).toBe(false);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'hadayeqelzeitoun')).toBe(false);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'الحيالثامن')).toBe(false);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'اخري')).toBe(false);
    expect(shouldMarkReady(100, 'ghost-key')).toBe(false);
  });

  it('لا يختم ready لمفتاح رسمي بقلة إعلانات', () => {
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES - 1, 'المقطم')).toBe(false);
  });

  it('لا يختم ready لمفتاح غير رسمي مهما بلغ العدد — مدينة-مظلة مُزالة مثل «القاهرة الجديدة»', () => {
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'القاهرهالجديده')).toBe(false);
    expect(shouldMarkReady(200, 'القاهرهالجديده')).toBe(false);
    // المشتقات الدقيقة لا تمسّ — تبقى أحياءً قابلة للعرض
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'التجمعالخامس')).toBe(true);
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'مدينتي')).toBe(true);
    // «القطامية» أصبحت حيًّا رسميًا (قرار ٢٧/٠٩) — تُختم ready إن توافر العدد
    expect(shouldMarkReady(MIN_DISPLAY_SOURCES, 'القطاميه')).toBe(true);
  });
});