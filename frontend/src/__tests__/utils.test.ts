import { describe, it, expect } from 'vitest';
import { trunc1Dec, format1Dec, cleanOptionPrefix } from '../utils';
import { saveAuthToken, getAuthToken, clearAuthToken } from '../utils/authUtils';

describe('Frontend Utils: Single Decimal Truncation (Rule 17)', () => {
  it('truncates without rounding up or down', () => {
    expect(trunc1Dec(6.21)).toBe(6.2);
    expect(trunc1Dec(6.28)).toBe(6.2);
    expect(trunc1Dec(8.89)).toBe(8.8);
    expect(trunc1Dec(8.81)).toBe(8.8);
    expect(trunc1Dec(10.0)).toBe(10.0);
    expect(trunc1Dec(0)).toBe(0);
  });

  it('formats to string with single decimal', () => {
    expect(format1Dec(6.21)).toBe('6.2');
    expect(format1Dec(6.28)).toBe('6.2');
    expect(format1Dec('8.89')).toBe('8.8');
    expect(format1Dec(null)).toBe('');
    expect(format1Dec(undefined)).toBe('');
  });
});

describe('Frontend Utils: cleanOptionPrefix', () => {
  it('cleans redundant A., B), 1. option prefixes', () => {
    expect(cleanOptionPrefix('A. Hello')).toBe('Hello');
    expect(cleanOptionPrefix('B) World')).toBe('World');
    expect(cleanOptionPrefix('c: Example')).toBe('Example');
    expect(cleanOptionPrefix('Normal text')).toBe('Normal text');
  });
});
