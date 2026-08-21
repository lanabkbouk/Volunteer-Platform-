import { describe, it, expect } from 'vitest'
import { buildVolunteerHoursSummary, isCompletedParticipation } from './volunteerHoursSummary'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'

const org1 = { id: 'org1', name: 'Org One' }
const org2 = { id: 'org2', name: 'Org Two' }

function participation(overrides) {
  return {
    status: PARTICIPATION_STATUS.ACCEPTED,
    hoursLogged: null,
    committedHours: 0,
    opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, organization: org1 },
    ...overrides,
  }
}

describe('isCompletedParticipation', () => {
  it('requires both accepted status and a completed opportunity', () => {
    expect(isCompletedParticipation(participation({}))).toBe(true)
    expect(
      isCompletedParticipation(
        participation({ opportunity: { status: OPPORTUNITY_STATUS.IN_PROGRESS, organization: org1 } }),
      ),
    ).toBe(false)
    expect(isCompletedParticipation(participation({ status: PARTICIPATION_STATUS.PENDING }))).toBe(false)
  })
})

describe('buildVolunteerHoursSummary', () => {
  it('returns an empty summary for no participations', () => {
    const summary = buildVolunteerHoursSummary([])
    expect(summary).toEqual({
      totalConfirmedHours: 0,
      totalPledgedHours: 0,
      completedOpportunitiesCount: 0,
      activeOpportunitiesCount: 0,
      organizationsCount: 0,
      byOrganization: [],
    })
  })

  it('sums hoursLogged (not committedHours) for completed+accepted participations only', () => {
    const participations = [
      participation({ hoursLogged: 5, committedHours: 4 }),
      participation({ hoursLogged: 3, committedHours: 10 }),
      // pending — should not count toward confirmed hours at all
      participation({ status: PARTICIPATION_STATUS.PENDING, hoursLogged: 99, committedHours: 2 }),
    ]

    const summary = buildVolunteerHoursSummary(participations)
    expect(summary.totalConfirmedHours).toBe(8)
    expect(summary.completedOpportunitiesCount).toBe(2)
  })

  it('counts accepted + in_progress opportunities as active, separately from completed', () => {
    const participations = [
      participation({ opportunity: { status: OPPORTUNITY_STATUS.IN_PROGRESS, organization: org1 } }),
      participation({}), // completed
    ]

    const summary = buildVolunteerHoursSummary(participations)
    expect(summary.activeOpportunitiesCount).toBe(1)
    expect(summary.completedOpportunitiesCount).toBe(1)
  })

  it('excludes rejected and withdrawn participations from pledged hours', () => {
    const participations = [
      participation({ status: PARTICIPATION_STATUS.PENDING, committedHours: 5 }),
      participation({ status: PARTICIPATION_STATUS.REJECTED, committedHours: 10 }),
      participation({ status: PARTICIPATION_STATUS.WITHDRAWN, committedHours: 20 }),
      participation({ committedHours: 3 }),
    ]

    const summary = buildVolunteerHoursSummary(participations)
    expect(summary.totalPledgedHours).toBe(8) // 5 (pending) + 3 (accepted), not the rejected/withdrawn ones
  })

  it('groups confirmed hours by organization, sorted descending, ignoring orgs with no id', () => {
    const participations = [
      participation({ hoursLogged: 4, opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, organization: org1 } }),
      participation({ hoursLogged: 20, opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, organization: org2 } }),
      participation({ hoursLogged: 6, opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, organization: org1 } }),
      // no organization id on the opportunity — must be skipped from byOrganization entirely
      participation({ hoursLogged: 99, opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, organization: null } }),
    ]

    const summary = buildVolunteerHoursSummary(participations)
    expect(summary.organizationsCount).toBe(2)
    expect(summary.byOrganization).toEqual([
      { organizationId: 'org2', organizationName: 'Org Two', confirmedHours: 20, completedOpportunitiesCount: 1 },
      { organizationId: 'org1', organizationName: 'Org One', confirmedHours: 10, completedOpportunitiesCount: 2 },
    ])
    // the org-less completed participation still counts toward the overall total...
    expect(summary.totalConfirmedHours).toBe(4 + 20 + 6 + 99)
    // ...but is invisible in the per-organization breakdown
    expect(summary.byOrganization.reduce((sum, entry) => sum + entry.confirmedHours, 0)).toBe(30)
  })
})
