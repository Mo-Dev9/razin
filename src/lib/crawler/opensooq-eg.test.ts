import { describe, it, expect } from 'vitest';
import { detectOpenSooqFrequency, isWantedListing, normalizeOpenSooqListing, opensooqParser, extractOpenSooqCardDetails } from '@/lib/crawler/opensooq-eg';

const offer = (name: string, price: number, locality: string, region: string) => ({
  '@type': 'Offer',
  availability: 'https://schema.org/InStock',
  itemOffered: {
    '@type': 'Apartment',
    name,
    url: `https://eg.opensooq.com/ar/search/1234567`,
    image: 'x.jpg',
    address: { '@type': 'PostalAddress', addressRegion: region, addressLocality: locality, addressCountry: 'EG' },
  },
  priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'EGP' },
});

describe('detectOpenSooqFrequency', () => {
  it('يكتشف اليومي من «ايجار ايام» و«اليومي»', () => {
    expect(detectOpenSooqFrequency('شقة مفروشة ايجار ايام بمدينة نصر')).toBe('daily');
    expect(detectOpenSooqFrequency('شاليه للايجار اليومي أمام البحر')).toBe('daily');
  });

  it('يكتشف السنوي من «السنوى»', () => {
    expect(detectOpenSooqFrequency('للايجار السنوى بشاطى النخيل')).toBe('yearly');
  });

  it('يعيد null (شهري ضمنًا) عند غياب الإشارة', () => {
    expect(detectOpenSooqFrequency('شقة للإيجار في فيصل من المالك')).toBeNull();
  });
});

describe('isWantedListing', () => {
  it('يستبعد طلبات «مطلوب شقة»', () => {
    expect(isWantedListing('مطلوب شقة للايجار الشهري')).toBe(true);
    expect(isWantedListing('نبحث عن شقة في المعادي')).toBe(true);
    expect(isWantedListing('أرغب في شقة مفروشة')).toBe(true);
  });

  it('لا يستبعد العروض العادية', () => {
    expect(isWantedListing('شقة مفروشة للايجار في المعادي')).toBe(false);
    expect(isWantedListing('لإيجار في كمبوند نيوم 6 اكتوبر')).toBe(false);
  });
});

describe('normalizeOpenSooqListing', () => {
  it('ينتج ParsedListing صحيحًا من Offer كامل (عربي)', () => {
    const l = normalizeOpenSooqListing(offer('شقة للإيجار في فيصل من المالك', 12000, 'فيصل', 'الجيزة'));
    expect(l).not.toBeNull();
    expect(l!.price).toBe(12000);
    expect(l!.currency).toBe('EGP');
    expect(l!.city).toBe('فيصل');
    expect(l!.governorate).toBe('الجيزة');
    expect(l!.propertyType).toBe('apartment');
    expect(l!.rentalFrequency).toBeNull();
    expect(l!.externalId).toBe('1234567');
  });

  it('يستبعد إعلان «مطلوب»', () => {
    expect(normalizeOpenSooqListing(offer('مطلوب شقة للايجار الشهري', 3000, 'مدينة بدر', 'القاهرة'))).toBeNull();
  });

  it('يستخلص التردد من نص العنوان', () => {
    const l = normalizeOpenSooqListing(offer('شقة للايجار اليومي بيانكي', 1000, 'عجمي', 'الإسكندرية'));
    expect(l!.rentalFrequency).toBe('daily');
  });

  it('يستخلص المساحة من نص العنوان', () => {
    const l = normalizeOpenSooqListing(offer('شقة 130م للإيجار في كابيتال إيست', 15000, 'مدينة نصر', 'القاهرة'));
    expect(l!.areaM2).toBe(130);
  });

  it('يرفض بدون سعر أو بدون رابط', () => {
    expect(normalizeOpenSooqListing({ ...offer('شقة', 100, 'x', 'y'), priceSpecification: { '@type': 'UnitPriceSpecification', priceCurrency: 'EGP' } })).toBeNull();
    const noUrl = offer('شقة', 100, 'x', 'y');
    noUrl.itemOffered.url = '';
    expect(normalizeOpenSooqListing(noUrl)).toBeNull();
  });
});

describe('extractOpenSooqCardDetails', () => {
  const card = (id: string, area: string, rooms: string, baths: string) => ({
    html: `<div><a href="/ar/search/${id}" data-id1="${id}" data-post-index="0">` +
      `<img src=".../star_cps/area.webp" alt="${area}" width="16" height="16" loading="lazy"/><span class="sc-4ab33c09-0">${area}</span>` +
      `<img src=".../star_cps/bedrooms.webp" alt="${rooms}" width="16" height="16" loading="lazy"/><span class="sc-4ab33c09-0">${rooms}</span>` +
      `<img src=".../star_cps/bathrooms.webp" alt="${baths}" width="16" height="16" loading="lazy"/><span class="sc-4ab33c09-0">${baths}</span>` +
      `</a></div>`,
    area, rooms, baths, id,
  });

  it('يستخرج المساحة والغرف والحمامات من بطاقة HTML (حمّامين/غرف عربية)', () => {
    const c = card('286745220', 'المساحة: 94 م2', '2 غرفتا نوم', 'حمّامين');
    const out = extractOpenSooqCardDetails(c.html);
    expect(out['286745220']).toEqual({ areaM2: 94, rooms: 2, bathrooms: 2 });
  });

  it('يقرأ «حمّام» مقابلًا لحمام واحد و«٣ حمّامات» بالأرقام المشرقية', () => {
    const c1 = card('111', 'المساحة: 60 م2', '1 غرفة نوم', 'حمّام');
    const c2 = card('222', 'المساحة: 130 م2', '3 غرف نوم', '٣ حمّامات');
    const out = extractOpenSooqCardDetails(c1.html + c2.html);
    expect(out['111'].bathrooms).toBe(1);
    expect(out['222'].bathrooms).toBe(3);
    expect(out['222'].rooms).toBe(3);
  });

  it('لا يكسر البيانات الغائبة (بطاقة بلا حمامات أو بلا data-id1)', () => {
    const out = extractOpenSooqCardDetails(`<div><a href="/ar/search/999" data-id1="999"><img src=".../star_cps/bedrooms.webp" alt="2 غرفتا نوم"/></a></div>`);
    expect(out['999']).toEqual({ areaM2: null, rooms: 2, bathrooms: null });
    expect(extractOpenSooqCardDetails('<div>لا بطاقات</div>')).toEqual({});
  });

  it('يَمزج تفاصيل البطاقات في النتائج النهائية للـ parser', () => {
    const one = offer('شقة 130م للإيجار في كابيتال إيست', 15000, 'مدينة نصر', 'القاهرة');
    const html =
      `<script type="application/ld+json">{"@context":"x","@graph":[]}</script>` +
      `<script type="application/ld+json">{"@graph":[{"@context":"s"},{"@type":"CollectionPage","itemListElement":[{"@type":"ListItem","position":1,"item":${JSON.stringify(one)}}]}]}</script>` +
      `<div><a href="/ar/search/1234567" data-id1="1234567" data-post-index="0">` +
      `<img src=".../star_cps/area.webp" alt="المساحة: 130 م2"/><span>المساحة: 130 م2</span>` +
      `<img src=".../star_cps/bedrooms.webp" alt="3 غرف نوم"/><span>3 غرف نوم</span>` +
      `<img src=".../star_cps/bathrooms.webp" alt="حمّامين"/><span>حمّامين</span>` +
      `</a></div>`;
    const result = opensooqParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].rooms).toBe(3);
    expect(result.items[0].bathrooms).toBe(2);
    expect(result.items[0].areaM2).toBe(130);
  });
});

describe('opensooqParser', () => {
  it('يحلل HTML بعيّنة ld+json كاملة → items + لا totalAvailable', () => {
    const one = offer('شقة 130م للإيجار في كابيتال إيست', 15000, 'مدينة نصر', 'القاهرة');
    const html = `<html><script type="application/ld+json">{"@context":"https://schema.org","@graph":[]}</script><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@context":"x"},{"@context":"y"},{"@type":"CollectionPage","itemListElement":[{"@type":"ListItem","position":1,"item":${JSON.stringify(one)}}]}]}</script></html>`;
    const result = opensooqParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(15000);
    expect(result.totalAvailable).toBeNull();
  });

  it('يتجاهل BreadcrumbList ويتخذ ItemList الأكبر (بنية حية: مسارات الخبز أولاً)', () => {
    const one = offer('شقة للإيجار في فيصل', 12000, 'فيصل', 'الجيزة');
    const html = `<script type="application/ld+json">{"@context":"x","@graph":[
      {"@type":"CollectionPage","mainEntity":{"@type":"ItemList","itemListElement":[{"@type":"ListItem","position":1,"item":${JSON.stringify(one)}}]}},
      {"@type":"BreadcrumbList","itemListElement":[{"name":"رئيسية"},{"name":"عقارات"}]}
    ]}</script>`;
    const result = opensooqParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('شقة للإيجار في فيصل');
  });

  it('يستبعد «مطلوب» ويزيل تكرار المعرفات', () => {
    const wanted = offer('مطلوب شقة', 500, 'x', 'y');
    const dup1 = offer('شقة مفروشة', 900, 'المعادي', 'القاهرة');
    const dup2 = offer('شقة مفروشة أخرى', 900, 'المعادي', 'القاهرة');
    const html = `<html><script type="application/ld+json">{"@context":"x","@graph":[]}</script><script type="application/ld+json">{"@graph":[{"t":1},{"t":2},{"itemListElement":[${[wanted, dup1, dup2].map((x) => JSON.stringify({ '@type': 'ListItem', item: x })).join(',')}]}]}</script></html>`;
    const result = opensooqParser.parseSearchHtml(html);
    expect(result.items.every((l) => l.title !== 'مطلوب شقة')).toBe(true);
    expect(result.items).toHaveLength(1); // كلها نفس المعرف 1234567
  });

  it('يحلل صفحة إعلان مفردة (رابط /ar/search/<id>): كتلة Apartment مباشرة بلا ItemList', () => {
    const singleAd = {
      '@context': 'https://schema.org',
      '@type': 'Apartment',
      name: 'استوديو مفروش بالزمالك موقع مميز',
      url: 'http://eg.opensooq.com/ar/search/287042268',
      address: { '@type': 'PostalAddress', addressCountry: 'مصر', addressRegion: 'Cairo', addressLocality: 'الزمالك' },
      numberOfRooms: 'Studio',
      offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', price: '25000', priceCurrency: 'EGP' },
    };
    const html = `<html><script type="application/ld+json">${JSON.stringify(singleAd)}</script></html>`;
    const result = opensooqParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].price).toBe(25000);
    expect(result.items[0].externalId).toBe('287042268');
    expect(result.items[0].city).toBe('الزمالك');
    expect(result.items[0].governorate).toBe('Cairo');
    expect(result.totalAvailable).toBe(1);
  });
});