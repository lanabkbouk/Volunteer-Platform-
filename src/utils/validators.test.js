import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calculateAge } from './validators'

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T00:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for empty/undefined input', () => {
    expect(calculateAge('')).toBeNull()
    expect(calculateAge(undefined)).toBeNull()
    expect(calculateAge(null)).toBeNull()
  })

  it('returns null for an unparseable date string', () => {
    expect(calculateAge('not-a-date')).toBeNull()
  })

  it('computes a full year when the birthday already passed this year', () => {
    // "today" is 2026-06-15 — birthday 2000-01-01 already passed
    expect(calculateAge('2000-01-01')).toBe(26)
  })

  it('does not count this year when the birthday has not happened yet', () => {
    // birthday 2000-12-25 is still ahead of 2026-06-15
    expect(calculateAge('2000-12-25')).toBe(25)
  })

  it('handles the birthday falling exactly today', () => {
    expect(calculateAge('2000-06-15')).toBe(26)
  })

  it('handles same month but a later day (not yet had the birthday)', () => {
    expect(calculateAge('2000-06-16')).toBe(25)
  })
})
