import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { canWithdraw } from './participationPolicy'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'

// canWithdraw() -> isRegistrationOpen() ما بتقبل now محقونة، بتعتمد
// دايمًا على new Date() الحقيقي — فلازم نثبّت الساعة هون وإلا التواريخ
// الثابتة تحت بتصير بالماضي فعليًا بعد فترة وتكسر الاختبار بصمت
const openOpportunity = { startDate: '2026-08-01', endDate: '2026-09-01' }
const closedOpportunity = { startDate: '2026-08-01', endDate: '2026-09-01', registrationClosedManually: true }

describe('canWithdraw', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T00:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('trusts an explicit boolean canWithdraw field from the API over any local computation', () => {
    expect(canWithdraw({ canWithdraw: false, status: PARTICIPATION_STATUS.PENDING, opportunity: openOpportunity })).toBe(false)
    expect(canWithdraw({ canWithdraw: true, status: PARTICIPATION_STATUS.REJECTED, opportunity: openOpportunity })).toBe(true)
  })

  it('allows withdrawal for pending participations while registration is open', () => {
    const participation = { status: PARTICIPATION_STATUS.PENDING, opportunity: openOpportunity }
    expect(canWithdraw(participation)).toBe(true)
  })

  it('allows withdrawal for accepted participations while registration is open', () => {
    const participation = { status: PARTICIPATION_STATUS.ACCEPTED, opportunity: openOpportunity }
    expect(canWithdraw(participation)).toBe(true)
  })

  it('blocks withdrawal once registration has closed, even if the opportunity has not started', () => {
    const participation = { status: PARTICIPATION_STATUS.ACCEPTED, opportunity: closedOpportunity }
    expect(canWithdraw(participation)).toBe(false)
  })

  it('blocks withdrawal for rejected participations regardless of registration state', () => {
    const participation = { status: PARTICIPATION_STATUS.REJECTED, opportunity: openOpportunity }
    expect(canWithdraw(participation)).toBe(false)
  })

  it('blocks withdrawal for already-withdrawn participations', () => {
    const participation = { status: PARTICIPATION_STATUS.WITHDRAWN, opportunity: openOpportunity }
    expect(canWithdraw(participation)).toBe(false)
  })

  it('blocks withdrawal for expired participations', () => {
    const participation = { status: PARTICIPATION_STATUS.EXPIRED, opportunity: openOpportunity }
    expect(canWithdraw(participation)).toBe(false)
  })
})
