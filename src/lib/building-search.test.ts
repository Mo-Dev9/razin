import { describe, it, expect } from 'vitest';
import { matchesBuildingSearch } from './building-search';
import { matchesCityFilter } from './egypt-cities';
import type { Building } from '@/types';

function makeBuilding(overrides: Partial<Building>): Building {
  return {
    id: 'b1',
    address: '',
    city: '',
    area: '',
    district: '',
    governorate: '',
    buildingNumber: '',
    floor: '',
    apartmentNumber: '',
    location: { lat: 30.0, lng: 31.2 },
    geohash: 'stq4yv3',
    averageRatings: {
      zahma: 0,
      humidity: 0,
      landlord: 0,
      neighbors: 0,
      cleanliness: 0,
      safety: 0,
      services: 0,
      annoyance: 0,
      elevator: 0,
      maintenance: 0,
      ac: 0,
      condition: 0,
      overall: 0,
    },
    reviewCount: 0,
    createdAt: 1700000000000,
    ...overrides,
  };
}
const gizaOctober = makeBuilding({
  id: 'g-oct',
  city: '6 أكتوبر',
  governorate: 'الجيزة',
  area: '6 أكتوبر',
  address: 'شارع المخابرات، مدينة 6 أكتوبر',
});
const gizaFaysal = makeBuilding({
  id: 'g-faysal',
  city: 'فيصل',
  governorate: 'الجيزة',
  area: 'فيصل',
  address: 'شارع فيصل',
});
const gizaHaram = makeBuilding({
  id: 'g-haram',
  city: 'الهرم',
  governorate: 'الجيزة',
  area: 'الهرم',
  address: 'شارع الهرم',
});
const cairoNasr = makeBuilding({
  id: 'c-nasr',
  city: 'مدينة نصر',
  governorate: 'القاهرة',
  area: 'مدينة نصر',
  address: 'شارع 6 أكتوبر، مدينة نصر',
});
const legacyGiza = makeBuilding({
  id: 'legacy-giza',
  city: 'الجيزة',
  area: 'فيصل',
  address: 'مبنى قديم في فيصل',
  governorate: '',
});

const sohagDarasalam = makeBuilding({
  id: 's-darasalam',
  city: 'دار السلام',
  governorate: 'سوهاج',
  area: 'دار السلام',
  address: 'سوهاج',
});
const cairoDarasalam = makeBuilding({
  id: 'c-darasalam',
  city: 'دار السلام',
  governorate: 'القاهرة',
  area: 'دار السلام',
  address: 'معادي',
});

function searchByText(buildings: Building[], query: string): Building[] {
  return buildings.filter((b) => matchesBuildingSearch(b, query));
}

function searchByCity(buildings: Building[], filter: string): Building[] {
  return buildings.filter((b) => matchesCityFilter(b.city, filter, b.governorate));
}

function searchByCityScoped(buildings: Building[], filter: string, filterGovernorate: string): Building[] {
  return buildings.filter((b) => matchesCityFilter(b.city, filter, b.governorate, filterGovernorate));
}

describe('matchesBuildingSearch — بحث نصي بدون فلتر', () => {
  const all = [gizaOctober, cairoNasr, gizaFaysal];

  it('«اكتوبر» يطابق نتائج متعددة (لا نتيجة واحدة) رغم اختلاف الهمزة', () => {
    const matched = searchByText(all, 'اكتوبر');
    expect(matched.map((b) => b.id).sort()).toEqual(['c-nasr', 'g-oct']);
  });

  it('«أكتوبر» بهمزة يطابق نفس النتائج', () => {
    const matched = searchByText(all, 'أكتوبر');
    expect(matched.map((b) => b.id).sort()).toEqual(['c-nasr', 'g-oct']);
  });

  it('استعلام غير مطابق لا يمرر شيئًا', () => {
    expect(searchByText(all, 'المنصورة')).toEqual([]);
  });
});

describe('فلتر مدينة/حي داخل محافظة', () => {
  const giza = [gizaOctober, gizaFaysal, gizaHaram];

  it('«6 أكتوبر» يمرر مبنى 6 أكتوبر فقط — لا فيصل ولا الهرم ولا مدينة نصر القاهرية', () => {
    const matched = searchByCity([...giza, cairoNasr], '6 أكتوبر');
    expect(matched.map((b) => b.id)).toEqual(['g-oct']);
  });

  it('«فيصل» يمرر فيصل فقط', () => {
    expect(searchByCity(giza, 'فيصل').map((b) => b.id)).toEqual(['g-faysal']);
  });

  it('«الهرم» يمرر الهرم فقط', () => {
    expect(searchByCity(giza, 'الهرم').map((b) => b.id)).toEqual(['g-haram']);
  });
});

describe('فلتر محافظة فقط (بدون مدينة)', () => {
  const all = [gizaOctober, gizaFaysal, gizaHaram, cairoNasr];

  it('«الجيزة» يمرر كل الجيزة ولا يمرر القاهرة', () => {
    const matched = searchByCity(all, 'الجيزة');
    expect(matched.map((b) => b.id).sort()).toEqual(['g-faysal', 'g-haram', 'g-oct']);
  });
});

describe('مبنى قديم مخزّن باسم المحافظة (بلا governorate)', () => {
  const all = [legacyGiza, gizaOctober];

  it('يظهر تحت فلتر محافظته العامة', () => {
    expect(searchByCity(all, 'الجيزة').map((b) => b.id)).toContain('legacy-giza');
  });

  it('لا يظهر تحت فلتر مدينة/حي محدد داخل محافظته (لا نعرف مدينته الحقيقية)', () => {
    expect(searchByCity(all, 'فيصل').map((b) => b.id)).not.toContain('legacy-giza');
    expect(searchByCity(all, '6 أكتوبر').map((b) => b.id)).not.toContain('legacy-giza');
  });
});

describe('أسماء متكررة عبر المحافظات تُحسم بالمحافظة المخزنة', () => {
  const all = [sohagDarasalam, cairoDarasalam, gizaFaysal];

  it('مبنى دار السلام السوهاجي يظهر في سوهاج فقط', () => {
    expect(searchByCity(all, 'سوهاج').map((b) => b.id)).toEqual(['s-darasalam']);
  });

  it('مبنى دار السلام القاهري يظهر في القاهرة فقط', () => {
    const matched = searchByCity(all, 'القاهرة');
    expect(matched.map((b) => b.id)).toEqual(['c-darasalam']);
  });

  it('فلتر مدينة «دار السلام» تحت سوهاج يمرر السوهاجي فقط (لا يتسرب للقاهرة)', () => {
    const matched = searchByCityScoped(all, 'دار السلام', 'سوهاج');
    expect(matched.map((b) => b.id)).toEqual(['s-darasalam']);
  });

  it('فلتر مدينة «دار السلام» تحت القاهرة يمرر القاهري فقط', () => {
    const matched = searchByCityScoped(all, 'دار السلام', 'القاهرة');
    expect(matched.map((b) => b.id)).toEqual(['c-darasalam']);
  });

  it('فلتر مدينة غامض بلا محافظة فلتر لا يمرر شيئًا (دفاعي — لا يحدث من الواجهة)', () => {
    // لا يمكن تمييز المحافظة المقصودة بدون تمرير محافظة الفلتر المختارة
    expect(searchByCity(all, 'دار السلام')).toEqual([]);
  });
});

describe('matchesBuildingSearch — بحث في حقول متعددة وحواف', () => {
  const fixtures = [
    makeBuilding({ id: 'num-5', buildingNumber: '5', city: 'الهرم', governorate: 'الجيزة' }),
    makeBuilding({ id: 'fl-3', floor: '3', city: 'الدقي', governorate: 'الجيزة' }),
    makeBuilding({ id: 'apt-12', apartmentNumber: '12', city: 'الدقي', governorate: 'الجيزة' }),
    makeBuilding({
      id: 'legacy-area',
      city: 'الجيزة',
      area: 'المنيل', // data قديم: الحي في area لا في city
      governorate: '',
    }),
    makeBuilding({
      id: 'district-field',
      city: '6 أكتوبر',
      district: 'الحي التاسع',
      governorate: 'الجيزة',
    }),
  ];

  it('يبحث في رقم العمارة والدور والشقة', () => {
    const all = [...fixtures];
    expect(searchByText(all, '5').map((b) => b.id)).toContain('num-5');
    expect(searchByText(all, '3').map((b) => b.id)).toContain('fl-3');
    expect(searchByText(all, '12').map((b) => b.id)).toContain('apt-12');
  });

  it('يبحث في حقل area القديم (الحي في النص الحر)', () => {
    expect(searchByText(fixtures, 'المنيل').map((b) => b.id)).toEqual(['legacy-area']);
  });

  it('يبحث في حقل district', () => {
    expect(searchByText(fixtures, 'الحي التاسع').map((b) => b.id)).toEqual(['district-field']);
  });

  it('استعلام فارغ أو مسافات = بلا قيد → يطابق كل المبانٍ (عقد الصفحة الرئيسية searchBuildings(\'\'))', () => {
    expect(matchesBuildingSearch(fixtures[0], '')).toBe(true);
    expect(matchesBuildingSearch(fixtures[0], '   ')).toBe(true);
  });

  it('التشكيل في الاستعلام لا يمنع المطابقة مع نص غير مشكول', () => {
    const engineers = makeBuilding({
      id: 'eng',
      city: 'الدقي',
      governorate: 'الجيزة',
      address: 'أبراج المهندسين',
    });
    expect(searchByText([...fixtures, engineers], 'اَلْمُهِنْدِسِين').map((b) => b.id)).toEqual(['eng']);
    expect(searchByText([...fixtures, engineers], 'أبراج المهندسين').map((b) => b.id)).toEqual(['eng']);
  });
});

describe('الفلاتر المتراكبة — بحث نصي ثم فلتر مدينة (مسار applyFilters)', () => {
  const all = [gizaOctober, cairoNasr, gizaFaysal];

  it('بحث «6 أكتوبر» يجد مبانٍ من المحافظتين ثم فلتر مدينة يقتصر على 6 أكتوبر الجيزية', () => {
    const textHits = searchByText(all, '6 أكتوبر');
    expect(textHits.map((b) => b.id).sort()).toEqual(['c-nasr', 'g-oct']);

    const cityFiltered = textHits.filter((b) => matchesCityFilter(b.city, '6 أكتوبر', b.governorate));
    expect(cityFiltered.map((b) => b.id)).toEqual(['g-oct']);
  });

  it('بحث «فيصل» يعزل مبنى فيصل حتى مع مبانٍ مشابهة الاسم في محافظات أخرى', () => {
    const cairoFaysalStreet = makeBuilding({
      id: 'c-faysal-street',
      city: 'جاردن سيتي',
      governorate: 'القاهرة',
      address: 'شارع فيصل',
    });
    const textHits = searchByText([...all, cairoFaysalStreet], 'فيصل');
    // المبنى القاهري عنوانه يحتوي "فيصل" لكن مدينته جاردن سيتي وليست فيصل
    expect(textHits.map((b) => b.id).sort()).toEqual(['c-faysal-street', 'g-faysal']);
    const cityFiltered = textHits.filter((b) => matchesCityFilter(b.city, 'فيصل', b.governorate));
    expect(cityFiltered.map((b) => b.id)).toEqual(['g-faysal']);
  });
});

describe('اشتقاق قائمة الأحياء (getAllDistricts) — سيناريو بيانات مختلطة', () => {
  // تحاكي getAllBuildings + getAllDistricts: الأحياء تُشتق من المبانٍ الناجية من الفلتر.
  const legacyWithDistrict = makeBuilding({
    id: 'legacy-dist',
    city: 'الجيزة',
    area: 'بولاق',
    district: 'بولاق الدكرور',
    governorate: '',
  });
  const newFaysal = makeBuilding({
    id: 'new-dist',
    city: 'فيصل',
    governorate: 'الجيزة',
    district: 'شارع فيصل',
  });

  const mixed = [legacyWithDistrict, newFaysal, gizaOctober];

  function districtsUnder(city?: string, governorate?: string): string[] {
    const filtered = mixed.filter((b) => {
      if (city) return matchesCityFilter(b.city, city, b.governorate, governorate);
      if (governorate) return matchesCityFilter(b.city, governorate, b.governorate);
      return true;
    });
    return [...new Set(filtered.map((b) => b.district).filter((d): d is string => !!d))].sort();
  }

  it('بلا فلتر: أحياء كل المبانٍ صاحبة district', () => {
    expect(districtsUnder()).toContain('بولاق الدكرور');
    expect(districtsUnder()).toContain('شارع فيصل');
  });

  it('تحت فلتر «الجيزة»: يبقى الحي القديم حاضرًا لأن مبناه القديم يمر', () => {
    const list = districtsUnder('الجيزة');
    expect(list).toContain('بولاق الدكرور');
    expect(list).toContain('شارع فيصل');
  });

  it('تحت فلتر «فيصل»: القديم (city=الجيزة) لا يساهم بحيّه في القائمة', () => {
    const list = districtsUnder('فيصل');
    expect(list).not.toContain('بولاق الدكرور');
    expect(list).toContain('شارع فيصل');
  });

  it('اسم حي غامض عبر المحافظات: القائمة تُحدَّ بتمرير محافظة الفلتر المختارة', () => {
    const sohagDist = makeBuilding({
      id: 's-dist',
      city: 'دار السلام',
      governorate: 'سوهاج',
      district: 'سوهاج شرق',
    });
    const cairoDist = makeBuilding({
      id: 'c-dist',
      city: 'دار السلام',
      governorate: 'القاهرة',
      district: 'دار السلام المعادي',
    });
    const ambiguous = [sohagDist, cairoDist];

    function districtsOf(buildings: Building[], city?: string, governorate?: string): string[] {
      return [
        ...new Set(
          buildings
            .filter((b) => matchesCityFilter(b.city, city!, b.governorate, governorate))
            .map((b) => b.district)
            .filter((d): d is string => !!d)
        ),
      ].sort();
    }

    expect(districtsOf(ambiguous, 'دار السلام', 'سوهاج')).toEqual(['سوهاج شرق']);
    expect(districtsOf(ambiguous, 'دار السلام', 'القاهرة')).toEqual(['دار السلام المعادي']);
    expect(districtsOf(ambiguous, 'دار السلام')).toEqual([]); // بلا محافظة فلتر لا تمييز
  });
});