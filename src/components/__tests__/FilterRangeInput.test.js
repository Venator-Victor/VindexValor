import { describe, it, expect } from 'vitest';
import { parseValueFilterString } from '../FilterRangeInput';

describe('parseValueFilterString', () => {
  it('accepts "." as the decimal separator', () => {
    const result = parseValueFilterString('>100.50');
    expect(result.isValid).toBe(true);
    expect(result.conditions).toEqual([{ op: '>', val: 100.5 }]);
  });

  it('accepts "," as the decimal separator', () => {
    const result = parseValueFilterString('>100,50');
    expect(result.isValid).toBe(true);
    expect(result.conditions).toEqual([{ op: '>', val: 100.5 }]);
  });

  it('accepts multiple comma-decimal conditions separated by ";"', () => {
    const result = parseValueFilterString('>100,50;<1000,99');
    expect(result.isValid).toBe(true);
    expect(result.conditions).toEqual([
      { op: '>', val: 100.5 },
      { op: '<', val: 1000.99 },
    ]);
  });

  it('defaults to "=" when no operator is given, with a comma decimal', () => {
    const result = parseValueFilterString('50,25');
    expect(result.isValid).toBe(true);
    expect(result.conditions).toEqual([{ op: '=', val: 50.25 }]);
  });

  it('flags a genuinely invalid entry', () => {
    const result = parseValueFilterString('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1);
  });

  it('returns no conditions for empty input', () => {
    expect(parseValueFilterString('')).toEqual({ isValid: true, conditions: [] });
    expect(parseValueFilterString('   ')).toEqual({ isValid: true, conditions: [] });
  });
});
