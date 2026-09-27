import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

const mockGetNeighborhoodMeta = vi.fn();

vi.mock('@/lib/neighborhood-data', () => ({
  getNeighborhoodMeta: (...args: unknown[]) => mockGetNeighborhoodMeta(...args),
}));

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost'));
}

beforeEach(() => {
  mockGetNeighborhoodMeta.mockReset();
});

describe('proxy للنطاق /neighborhood', () => {
  it('يمرّر الحي الموجود في الكتالوج الثابت دون لمس قاعدة البيانات', async () => {
    const res = await proxy(makeRequest('/neighborhood/مدينهنصر'));
    expect(res.status).toBe(200);
    expect(mockGetNeighborhoodMeta).not.toHaveBeenCalled();
  });

  it('يمرّر الحي المسجّل في قاعدة البيانات فقط (اسم غريب غير موجود بالكتالوج)', async () => {
    mockGetNeighborhoodMeta.mockResolvedValue({ neighborhoodId: 'حيادي', ready: true });
    const res = await proxy(makeRequest('/neighborhood/اسماعشوائي'));
    expect(mockGetNeighborhoodMeta).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('يعيد 404 حقيقيًا لحي غير موجود في الكتالوج ولا في قاعدة البيانات', async () => {
    mockGetNeighborhoodMeta.mockResolvedValue(null);
    const res = await proxy(makeRequest('/neighborhood/zzzzzznotreal'));
    expect(mockGetNeighborhoodMeta).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(404);
  });

  it('يعيد 404 دون أي استعلام لقاعدة بيانات عند معرّف غير صالح (a%2Fb)', async () => {
    const res = await proxy(makeRequest('/neighborhood/a%2Fb'));
    expect(res.status).toBe(404);
    expect(mockGetNeighborhoodMeta).not.toHaveBeenCalled();
  });

  it('يمرّر عند فشل قاعدة البيانات حتى لا يسقط الموقع', async () => {
    mockGetNeighborhoodMeta.mockRejectedValue(new Error('db down'));
    const res = await proxy(makeRequest('/neighborhood/اسماعشوائي'));
    expect(res.status).toBe(200);
  });
});