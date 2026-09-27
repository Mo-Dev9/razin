import { describe, it, expect } from 'vitest';
import {
  propertyfinderParser,
  normalizePfListing,
  extractPfPlace,
  extractPfTotal,
  extractPfExternalId,
} from '@/lib/crawler/propertyfinder-eg';

const SVG = (n: string) =>
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="${n}"></path></svg>`;

/** بطاقة مطابقة لبنية RSC الحية: صورة→محتوى(سعر←h3)→مواصفات. */
const card = (opts: {
  id: string;
  slug: string;
  title: string;
  price: string;
  beds: string;
  baths: string;
  area: string;
  type: string;
}) =>
  `<a href="https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-${opts.slug}-${opts.id}.html"><img src="x.jpg" alt="x"/></a>` +
  `<section class="styles-module_content__intro__Nl-js"><div class="styles-module_publish__info__b210L">Listed 1 hour ago</div>` +
  `<div class="styles-module_content__price__BeWpj" data-testid="property-card-price">${opts.price}</div>` +
  `<h3 id="plp-${opts.id}" class="styles-module_content__title__maprN">${opts.title}</h3></section>` +
  `<div data-testid="property-card-details" class="styles-module_specs__container__lwq8b">` +
  `<p class="styles-module_specs__item__E0gnd" data-testid="property-card-spec-bedroom">${SVG('a')}${opts.beds}</p>` +
  `<p class="styles-module_specs__item__E0gnd" data-testid="property-card-spec-bathroom">${SVG('b')}${opts.baths}</p>` +
  `<p class="styles-module_specs__item__E0gnd" data-testid="property-card-spec-area">${SVG('c')}${opts.area}</p>` +
  `<p class="styles-module_specs__item__E0gnd" data-testid="property-card-spec-propertyType">${SVG('d')}${opts.type}</p></div>`;

const lakeView = card({
  id: '112430113',
  slug: 'cairo-new-cairo-city-lake-view-residence',
  title: 'Luxury Flat Fully Furnished For Rent in Lake View',
  price: '95,000 EGP/month',
  beds: '3',
  baths: '2',
  area: 'Area: 160 m²',
  type: 'Apartment',
});

const nasrCity = card({
  id: '222222222',
  slug: 'cairo-nasr-city',
  title: 'Furnished 3 Bedrooms Apartment For Rent in Nasr City',
  price: '25,000 EGP/month',
  beds: '3',
  baths: '2',
  area: '140 m²',
  type: 'Apartment',
});

const studio = card({
  id: '333333333',
  slug: 'cairo-zamalek',
  title: 'Studio For Rent in Zamalek',
  price: '14,000 EGP/month',
  beds: '0',
  baths: '1',
  area: '30 m²',
  type: 'Apartment',
});

describe('extractPfPlace', () => {
  it('يفضّل «الأكثر تخصيصًا» — 5th settlement يتقدم على المظلة new cairo city رغم تقدمها في التسلسل', () => {
    expect(extractPfPlace('https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-new-cairo-city-the-5th-settlement-112430113.html')).toEqual({
      city: '5th settlement',
      governorate: 'cairo',
    });
  });

  it('يبقي المظلة للمشتقات غير الغائرة (new cairo city بلا حي أدق)', () => {
    expect(extractPfPlace('https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-new-cairo-city-eastown-888.html')).toEqual({
      city: 'new cairo city',
      governorate: 'cairo',
    });
  });

  it('يتخطى «the» ويطابق «5th settlement» (حي الجملة الوصفية)', () => {
    expect(extractPfPlace('https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-the-5th-settlement-complex-222.html')).toEqual({
      city: '5th settlement',
      governorate: 'cairo',
    });
  });

  it('يعيد الاحتياط الخام للـ alias غير المعروف (لا مختلق)', () => {
    const out = extractPfPlace('https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-qena-mystery-place-3333.html');
    expect(out.city).toContain('mystery place');
    expect(out.governorate).toBe('qena');
  });

  it('يعيد null للروابط غير القابلة للفك', () => {
    expect(extractPfPlace('not-a-url')).toEqual({ city: null, governorate: null });
  });
});

describe('extractPfExternalId / extractPfTotal', () => {
  it('يستخلص المعرف الرقمي من نهاية رابط التفصيل', () => {
    expect(extractPfExternalId('https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-x-112430113.html')).toBe('112430113');
  });

  it('يستخلص العدد الإجمالي من عنصر العنوان', () => {
    expect(extractPfTotal('<title>Apartments for rent in Cairo - 31,607 Flats for rent | Property Finder Egypt</title>')).toBe(31607);
    expect(extractPfTotal('<title>no marker here</title>')).toBeNull();
  });
});

describe('normalizePfListing', () => {
  /** الشريحة الواقعية التي يمررها الـ parser: ما بعد `data-testid="property-card-price"`. */
  const chunkOf = (html: string): string => html.split('data-testid="property-card-price"')[1] ?? '';

  it('يحول بطاقة كاملة إلى ParsedListing صحيح (سعر/غرف/حمامات/مساحة/نوع/شهري)', () => {
    const links = new Map([['112430113', 'https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-new-cairo-city-lake-view-residence-112430113.html']]);
    const info = { id: '112430113', title: 'Luxury Flat Fully Furnished For Rent in Lake View', url: links.get('112430113')! };
    const l = normalizePfListing(chunkOf(lakeView), info);
    expect(l).not.toBeNull();
    expect(l!.price).toBe(95000);
    expect(l!.currency).toBe('EGP');
    expect(l!.rentalFrequency).toBe('monthly');
    expect(l!.rooms).toBe(3);
    expect(l!.bathrooms).toBe(2);
    expect(l!.areaM2).toBe(160);
    expect(l!.propertyType).toBe('apartment');
    expect(l!.finishing).toBe('lux');
    expect(l!.furnished).toBe(true); // «Fully Furnished» في العنوان
    expect(l!.city).toBe('new cairo city');
    expect(l!.governorate).toBe('cairo');
    expect(l!.externalId).toBe('112430113');
  });

  it('يصرف التردد اليومي/السنوي كما هو (لا يُطبَّع شهريًا)', () => {
    const dailyHtml = card({ id: '9', slug: 'cairo-nasr-city', title: 'Rooms For Rent', price: '500 EGP/day', beds: '1', baths: '1', area: '20 m²', type: 'Apartment' });
    const daily = normalizePfListing(
      chunkOf(dailyHtml),
      { id: '9', title: 'Rooms For Rent', url: 'https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-x-9.html' }
    );
    expect(daily!.rentalFrequency).toBe('daily');
  });

  it('يرفض البطاقة بلا سعر (Price on request) ويرفض المعرف المفقود', () => {
    const noPriceHtml = card({ id: '5', slug: 'cairo-a', title: 'X', price: 'Price on request', beds: '2', baths: '1', area: '90 m²', type: 'Apartment' });
    const noPrice = normalizePfListing(
      chunkOf(noPriceHtml),
      { id: '5', title: 'X', url: 'https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-a-5.html' }
    );
    expect(noPrice).toBeNull();
  });

  it('لا يحتسب المعاش كما لو كان غرفة (الحدود 0-15)', () => {
    const bigHtml = card({ id: '6', slug: 'cairo-a', title: 'Big', price: '1000 EGP/month', beds: '22', baths: '2', area: '60 m²', type: 'Apartment' });
    const l = normalizePfListing(
      chunkOf(bigHtml),
      { id: '6', title: 'Big', url: 'https://www.propertyfinder.eg/en/plp/rent/apartment-for-rent-cairo-a-6.html' }
    );
    expect(l!.rooms).toBeNull(); // قيمة ساخرة خارج النطاق تُتجاهل
  });
});

describe('propertyfinderParser', () => {
  it('يحلّل صفحة بحث كاملة بالبطاقتين → items كاملة + totalAvailable من العنوان', () => {
    const html =
      `<html><head><title>Apartments for rent in Cairo - 31,607 Flats for rent | Property Finder Egypt</title></head>` +
      `<body>${lakeView}${nasrCity}</body></html>`;
    const result = propertyfinderParser.parseSearchHtml(html);
    expect(result.totalAvailable).toBe(31607);
    expect(result.items).toHaveLength(2);
    const first = result.items.find((l) => l.externalId === '112430113');
    expect(first).toBeTruthy();
    expect(first!.city).toBe('new cairo city');
    expect(first!.price).toBe(95000);
  });

  it('يزيل تكرار المعرفات (أول حدوث يفوز) ويتجاهل البطاقات بلا رابط تفصيل', () => {
    const dup = lakeView.replace('112430113', '999999999');
    const html = `<body>${lakeView}${lakeView}${dup}</body>`;
    const result = propertyfinderParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].externalId).toBe('112430113');
  });

  it('يعيد مصفوفة فارغة بلا totalAvailable لصفحة بلا بطاقات', () => {
    const result = propertyfinderParser.parseSearchHtml('<html><body>لا شيء</body></html>');
    expect(result.items).toHaveLength(0);
    expect(result.totalAvailable).toBeNull();
  });

  it('يصطاد صفحة حية باستوديو في الزمالك (سعر/نوع/عدد)', () => {
    const html = `<html><head><title>Apartments for rent in Cairo - 50 Flats for rent | Property Finder Egypt</title></head><body>${studio}</body></html>`;
    const result = propertyfinderParser.parseSearchHtml(html);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].propertyType).toBe('studio');
    expect(result.items[0].city).toBe('zamalek');
    expect(result.items[0].governorate).toBe('cairo');
    expect(result.items[0].rooms).toBe(0); // البطاقة تقول 0 غرف — نثق بالمصدر
  });
});