import { describe, it, expect } from 'vitest';
import { buildingLocationLabel } from './building-location';

describe('buildingLocationLabel', () => {
  it('shows governorate + city for new buildings', () => {
    expect(buildingLocationLabel({ governorate: 'الجيزة', city: '6 أكتوبر' })).toBe('الجيزة، 6 أكتوبر');
  });

  it('keeps legacy entries without governorate as city only', () => {
    expect(buildingLocationLabel({ city: 'المعادي', area: 'زهراء المعادي' })).toBe('المعادي');
  });

  it('falls back to area when city is missing', () => {
    expect(buildingLocationLabel({ area: 'مدينة نصر' })).toBe('مدينة نصر');
  });

  it('returns empty string when nothing is set', () => {
    expect(buildingLocationLabel({})).toBe('');
  });

  it('handles empty strings gracefully', () => {
    expect(buildingLocationLabel({ governorate: '', city: '', area: '' })).toBe('');
  });

  it('trims whitespace', () => {
    expect(buildingLocationLabel({ governorate: '  القاهرة  ', city: '  المعادي ' })).toBe('القاهرة، المعادي');
  });
});