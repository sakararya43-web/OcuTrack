import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatShortDate,
  formatStatusLabel,
  sanitizeClinicalText,
} from '../lib/formatters';

describe('formatters', () => {
  it('formats null dates safely as a standard hyphen', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatShortDate(null)).toBe('-');
  });

  it('formats valid ISO dates', () => {
    const formatted = formatShortDate('2026-11-16T12:00:00Z');
    expect(formatted).toContain('2026');
  });

  it('formats snake_case status labels into human-readable words', () => {
    expect(formatStatusLabel('insufficient_quality')).toBe('Insufficient Quality');
    expect(formatStatusLabel('not_configured')).toBe('Not Configured');
    expect(formatStatusLabel('complete')).toBe('Complete');
  });

  it('normalizes em dashes in backend clinical strings to standard punctuation', () => {
    expect(sanitizeClinicalText('Change detected — consider repeat measurement')).toBe(
      'Change detected: consider repeat measurement'
    );
    expect(sanitizeClinicalText(null)).toBe('');
  });
});
