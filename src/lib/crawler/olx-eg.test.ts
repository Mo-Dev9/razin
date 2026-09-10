import { describe, it, expect } from 'vitest';
import {
  buildSearchUrl,
  extractJsonLdBlocks,
  parseOlxSearchHtml,
  normalizeLdListing,
  extractExternalId,
  reasonForStatus,
  detectPropertyType,
  detectFinishing,
} from '@/lib/crawler/olx-eg';

/** بنية JSON-LD فعلية مؤكدة من صفحة OLX مصر (سبتمبر 2026) — عيّنة حقيقية. */
function fixtureHtml(itemsJson: string): string {
  return `<!doctype html><html><head>
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"CollectionPage",
  "mainEntity":{"@type":"ItemList","name":"Apartments for Rent in Alexandria","numberOfItems":3081,"itemListElement":[${itemsJson}]}
}</script>
</head><body></body></html>`;
}

const SMOUHA_ITEM = `{
  "@type":"ListItem","position":1,
  "item":{
    "@type":"RealEstateListing",
    "name":"Apartment for Rent 125 m, Smouha (El Qoton Towers)",
    "url":"https://www.dubizzle.com.eg/ad/apartment-for-rent-125-m-smouha-el-qoton-towers-ID504023080.html",
    "image":"https://images.dubizzle.com.eg/thumbnails/183029604-400x300.webp",
    "mainEntity":{
      "@type":"Apartment","name":"Apartment","numberOfBedrooms":2,"numberOfBathroomsTotal":2,
      "floorSize":{"value":125,"unitCode":"MTK"},
      "address":{"addressLocality":"Smouha","addressRegion":"Alexandria Governorate","addressCountry":"EG"},
      "additionalProperty":[
        {"@type":"PropertyValue","name":"Property Type","value":"APARTMENT"},
        {"@type":"PropertyValue","name":"Furnished","value":"Yes"}
      ]
    },
    "offers":{
      "@type":"Offer",
      "url":"https://www.dubizzle.com.eg/ad/apartment-for-rent-125-m-smouha-el-qoton-towers-ID504023080.html",
      "price":22000,"priceCurrency":"EGP",
      "priceSpecification":{"@type":"UnitPriceSpecification","name":"Monthly rent","price":22000,"priceCurrency":"EGP","unitText":"MONTH"},
      "availableAtOrFrom":{"@type":"Place","name":"Smouha, Alexandria","address":{"addressLocality":"Smouha"}}
    }
  }
}`;

const MARASSI_ITEM = `{
  "@type":"ListItem","position":2,
  "item":{
    "@type":"RealEstateListing",
    "name":"Stylish Studio in Marassi Marina 2 | 2 Beds | Large Terrace",
    "url":"https://www.dubizzle.com.eg/ad/stylish-studio-marassi-marina-2-ID504012345.html",
    "mainEntity":{
      "@type":"Apartment","accommodationCategory":"Chalet",
      "numberOfBedrooms":2,"numberOfBathroomsTotal":1,
      "floorSize":{"value":120,"unitCode":"MTK"},
      "address":{"addressLocality":"Marassi, Sidi Abdel Rahman","addressRegion":"Matrouh Governorate"}
    },
    "offers":{
      "@type":"Offer",
      "url":"https://www.dubizzle.com.eg/ad/stylish-studio-marassi-marina-2-ID504012345.html",
      "price":7500,"priceCurrency":"EGP",
      "priceSpecification":{"@type":"UnitPriceSpecification","name":"Daily rent","price":7500,"priceCurrency":"EGP","unitText":"DAY"}
    }
  }
}`;

describe('buildSearchUrl', () => {
  it('builds base category URL', () => {
    expect(buildSearchUrl('https://www.olx.com.eg', { category: 'apartments-for-rent' })).toBe(
      'https://www.olx.com.eg/en/properties/apartments-for-rent',
    );
  });

  it('builds query URL (EN and Arabic)', () => {
    expect(buildSearchUrl('https://www.olx.com.eg', { category: 'apartments-for-rent', query: 'شقة' })).toBe(
      'https://www.olx.com.eg/en/properties/apartments-for-rent/q-%D8%B4%D9%82%D8%A9',
    );
    expect(buildSearchUrl('https://www.olx.com.eg', { category: 'apartments-for-rent', query: '2 bedrooms' })).toBe(
      'https://www.olx.com.eg/en/properties/apartments-for-rent/q-2%20bedrooms',
    );
  });

  it('builds i2 city URL (real confirmed format)', () => {
    expect(buildSearchUrl('https://www.olx.com.eg', { category: 'apartments-duplex-for-rent', city: 'Alexandria' })).toBe(
      'https://www.olx.com.eg/en/i2/properties/apartments-duplex-for-rent/alexandria',
    );
    expect(
      buildSearchUrl('https://www.olx.com.eg', { category: 'apartments-duplex-for-rent', city: 'Alexandria', query: 'شقة عائلي' }),
    ).toBe(
      'https://www.olx.com.eg/en/i2/properties/apartments-duplex-for-rent/alexandria/q-%D8%B4%D9%82%D8%A9%20%D8%B9%D8%A7%D8%A6%D9%84%D9%8A',
    );
  });

  it('throws without a category', () => {
    expect(() => buildSearchUrl('https://www.olx.com.eg', { category: '  ' })).toThrow();
  });
});

describe('parseOlxSearchHtml', () => {
  it('normalizes a real monthly-apartment listing', () => {
    const html = fixtureHtml(SMOUHA_ITEM);
    const { items, totalAvailable } = parseOlxSearchHtml(html);
    expect(totalAvailable).toBe(3081);
    expect(items).toHaveLength(1);
    const it = items[0]!;
    expect(it.price).toBe(22000);
    expect(it.currency).toBe('EGP');
    expect(it.propertyType).toBe('apartment');
    expect(it.city).toBe('Smouha');
    expect(it.governorate).toBe('Alexandria Governorate');
    expect(it.rooms).toBe(2);
    expect(it.bathrooms).toBe(2);
    expect(it.areaM2).toBe(125);
    expect(it.rentalFrequency).toBe('monthly');
    expect(it.finishing).toBeNull();
  });

  it('detects a daily studio and distinguishes frequencies', () => {
    const { items } = parseOlxSearchHtml(fixtureHtml(MARASSI_ITEM));
    const it = items[0]!;
    expect(it.propertyType).toBe('studio');
    expect(it.rentalFrequency).toBe('daily');
    expect(it.price).toBe(7500);
  });

  it('handles both items and dedupes by external id', () => {
    const dup = MARASSI_ITEM.replace('504012345', '504023080');
    const { items, totalAvailable } = parseOlxSearchHtml(fixtureHtml(`${SMOUHA_ITEM},${MARASSI_ITEM},${dup}`));
    expect(totalAvailable).toBe(3081);
    expect(items).toHaveLength(2);
  });

  it('returns empty result on unrelated html', () => {
    const { items, totalAvailable } = parseOlxSearchHtml('<html><body>nothing</body></html>');
    expect(items).toHaveLength(0);
    expect(totalAvailable).toBeNull();
  });

  it('handles the live @graph/CollectionPage structure (real Sep-2026 shape)', () => {
    const list = JSON.parse(`[${SMOUHA_ITEM},${MARASSI_ITEM}]`);
    const graphBlock = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          mainEntity: { '@type': 'ItemList', numberOfItems: 3081, itemListElement: list },
        },
      ],
    });
    const { items, totalAvailable } = parseOlxSearchHtml(
      `<script type="application/ld+json">${graphBlock}</script>`,
    );
    expect(totalAvailable).toBe(3081);
    expect(items).toHaveLength(2);
    expect(items[0]!.city).toBe('Smouha');
  });

  it('skips corrupt JSON blocks without failing', () => {
    const html = `<script type="application/ld+json">{broken</script>${fixtureHtml(SMOUHA_ITEM)}`;
    const { items } = parseOlxSearchHtml(html);
    expect(items).toHaveLength(1);
  });

  it('extracts JsonLD blocks only of the right type', () => {
    const html = `<script type="application/ld+json">{"a":1}</script><script type="application/json">{"x":2}</script>`;
    expect(extractJsonLdBlocks(html)).toHaveLength(1);
  });
});

describe('normalizeLdListing edge cases', () => {
  it('returns null for a listing without price or url', () => {
    expect(
      normalizeLdListing({
        name: 'X',
        mainEntity: { '@type': 'Apartment' },
        offers: { price: 5000 },
      }),
    ).toBeNull();
  });

  it('keeps taxonomy null (no invented values) when source is silent', () => {
    const p = normalizeLdListing({
      name: 'Something for rent',
      url: 'https://www.dubizzle.com.eg/ad/unknown-ID1.html',
      offers: { price: 1000, priceCurrency: 'EGP' },
      mainEntity: { '@type': 'Apartment' },
    });
    expect(p).not.toBeNull();
    expect(p!.city).toBeNull();
    expect(p!.propertyType).toBe('apartment'); // entityType وحده
    expect(p!.finishing).toBeNull();
    expect(p!.rentalFrequency).toBeNull();
    expect(p!.externalId).toBe('1');
  });

  it('parses ISO dates as epoch ms', () => {
    const p = normalizeLdListing({
      name: 'X',
      url: 'https://www.dubizzle.com.eg/ad/x-ID2.html',
      datePublished: '2026-09-01T10:00:00Z',
      offers: { price: 1000 },
      mainEntity: { '@type': 'Apartment' },
    });
    expect(p!.listedAt).toBe(Date.parse('2026-09-01T10:00:00Z'));
  });
});

describe('helpers', () => {
  it('extracts the numeric id from the ad URL', () => {
    expect(extractExternalId('https://www.dubizzle.com.eg/ad/apartment-for-rent-ID504023080.html')).toBe('504023080');
  });

  it('detects property types from text and entity type', () => {
    expect(detectPropertyType('Villa for sale', 'Villa')).toBe('villa');
    expect(detectPropertyType('Duplex', 'Duplex')).toBe('duplex');
    expect(detectPropertyType('Flat for rent in Maadi', 'Apartment')).toBe('apartment');
    expect(detectPropertyType('Office space', 'Office')).toBe('office');
    expect(detectPropertyType('q1', 'Warehouse')).toBeNull();
  });

  it('detects finishing levels from known keywords', () => {
    expect(detectFinishing('Super Luxury')).toBe('super-lux');
    expect(detectFinishing('Completion Status: Ready', null)).toBeNull();
    expect(detectFinishing(null, 'Fully Finished')).toBeNull(); // entityType ليس سمة تشطيب
  });

  it('maps HTTP protection statuses to manual-collection reasons', () => {
    expect(reasonForStatus(401)?.reason).toBe('login');
    expect(reasonForStatus(403)?.reason).toBe('protected');
    expect(reasonForStatus(429)?.reason).toBe('captcha');
    expect(reasonForStatus(404)?.reason).toBe('blocked');
    expect(reasonForStatus(200)).toBeNull();
  });
});