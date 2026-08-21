import { describe, it, expect } from 'vitest'
import {
  getEffectiveOpportunityStatus,
  isRegistrationOpen,
  isSuccessfulOpportunity,
  getDaysUntilStart,
} from './opportunityStatus'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'

const NOW = new Date('2026-06-15T00:00:00')

describe('getEffectiveOpportunityStatus', () => {
  it('is registration_open when nothing is full, closed or past its window', () => {
    const opportunity = { startDate: '2026-07-01', endDate: '2026-08-01', currentVolunteers: 2, maxVolunteers: 10 }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.REGISTRATION_OPEN)
  })

  it('is registration_closed once currentVolunteers reaches maxVolunteers', () => {
    const opportunity = { startDate: '2026-07-01', endDate: '2026-08-01', currentVolunteers: 10, maxVolunteers: 10 }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.REGISTRATION_CLOSED)
  })

  it('is registration_closed once registerEndAt has passed', () => {
    const opportunity = { startDate: '2026-07-01', endDate: '2026-08-01', registerEndAt: '2026-06-01' }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.REGISTRATION_CLOSED)
  })

  it('is registration_closed when the organization closed it manually', () => {
    const opportunity = { startDate: '2026-07-01', endDate: '2026-08-01', registrationClosedManually: true }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.REGISTRATION_CLOSED)
  })

  it('is in_progress once startDate has been reached, even if registration was never closed', () => {
    const opportunity = { startDate: '2026-06-01', endDate: '2026-08-01', currentVolunteers: 1, maxVolunteers: 10 }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.IN_PROGRESS)
  })

  it('is completed once endDate has passed, taking priority over everything else', () => {
    const opportunity = { startDate: '2026-01-01', endDate: '2026-06-01', currentVolunteers: 1, maxVolunteers: 10 }
    expect(getEffectiveOpportunityStatus(opportunity, NOW)).toBe(OPPORTUNITY_STATUS.COMPLETED)
  })
})

describe('isRegistrationOpen', () => {
  it('mirrors getEffectiveOpportunityStatus === registration_open', () => {
    const open = { startDate: '2026-07-01', endDate: '2026-08-01' }
    const closed = { startDate: '2026-07-01', endDate: '2026-08-01', registrationClosedManually: true }
    expect(isRegistrationOpen(open, NOW)).toBe(true)
    expect(isRegistrationOpen(closed, NOW)).toBe(false)
  })
})

describe('isSuccessfulOpportunity', () => {
  it('is false when the opportunity has not completed yet', () => {
    const opportunity = { startDate: '2026-07-01', endDate: '2026-08-01', currentVolunteers: 20, minVolunteers: 5 }
    expect(isSuccessfulOpportunity(opportunity, NOW)).toBe(false)
  })

  it('is false when completed but under minVolunteers', () => {
    const opportunity = { startDate: '2026-01-01', endDate: '2026-06-01', currentVolunteers: 2, minVolunteers: 20 }
    expect(isSuccessfulOpportunity(opportunity, NOW)).toBe(false)
  })

  it('is true when completed and currentVolunteers reached minVolunteers', () => {
    const opportunity = { startDate: '2026-01-01', endDate: '2026-06-01', currentVolunteers: 25, minVolunteers: 20 }
    expect(isSuccessfulOpportunity(opportunity, NOW)).toBe(true)
  })

  it('does not crash when minVolunteers is missing (undefined >= comparisons)', () => {
    const opportunity = { startDate: '2026-01-01', endDate: '2026-06-01', currentVolunteers: 5 }
    expect(isSuccessfulOpportunity(opportunity, NOW)).toBe(true)
  })
})

describe('getDaysUntilStart', () => {
  it('returns null when there is no startDate', () => {
    expect(getDaysUntilStart(undefined, NOW)).toBeNull()
  })

  it('returns null when the opportunity already started', () => {
    expect(getDaysUntilStart('2026-06-14', NOW)).toBeNull()
  })

  it('returns null when the start is further than 2 days away', () => {
    expect(getDaysUntilStart('2026-06-20T00:00:00', NOW)).toBeNull()
  })

  it('returns the day count when starting within the next 2 days', () => {
    // datetime (not bare date) format on both sides — a bare 'YYYY-MM-DD'
    // string parses as UTC midnight while `NOW` (no offset) parses as
    // local midnight, which can silently shift this by a day depending
    // on the machine's timezone
    expect(getDaysUntilStart('2026-06-16T00:00:00', NOW)).toBe(1)
  })
})
