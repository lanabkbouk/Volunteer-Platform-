import { describe, it, expect } from 'vitest'
import { computeAchievementsFromParticipations } from './achievements'
import { PARTICIPATION_STATUS } from '../constants/participationStatus'
import { OPPORTUNITY_STATUS } from '../constants/opportunityStatus'

function completedParticipation({ hoursLogged, joinedDate, isGroup = false }) {
  return {
    status: PARTICIPATION_STATUS.ACCEPTED,
    hoursLogged,
    committedHours: hoursLogged,
    joinedDate,
    opportunity: { status: OPPORTUNITY_STATUS.COMPLETED, isGroup },
  }
}

function findAchievement(achievements, id) {
  return achievements.find((item) => item.id === id)
}

describe('computeAchievementsFromParticipations', () => {
  it('returns all three achievements locked when there are no participations', () => {
    const achievements = computeAchievementsFromParticipations([])
    expect(achievements).toHaveLength(3)
    achievements.forEach((achievement) => {
      expect(achievement.unlocked).toBe(false)
      expect(achievement.earnedDate).toBeNull()
    })
  })

  it('unlocks a1 ("first opportunity") after a single completed participation, regardless of hours or group status', () => {
    const participations = [completedParticipation({ hoursLogged: 2, joinedDate: '2026-01-10' })]
    const achievements = computeAchievementsFromParticipations(participations)
    expect(findAchievement(achievements, 'a1').unlocked).toBe(true)
    expect(findAchievement(achievements, 'a1').earnedDate).toBe('2026-01-10')
  })

  it('does not unlock a1 for a pending/non-completed participation', () => {
    const participations = [
      { status: PARTICIPATION_STATUS.PENDING, hoursLogged: null, committedHours: 5, joinedDate: '2026-01-10', opportunity: { status: OPPORTUNITY_STATUS.IN_PROGRESS, isGroup: true } },
    ]
    expect(findAchievement(computeAchievementsFromParticipations(participations), 'a1').unlocked).toBe(false)
  })

  it('unlocks a2 ("10 hours") once totalConfirmedHours reaches 10, summing across opportunities', () => {
    const below = [completedParticipation({ hoursLogged: 4, joinedDate: '2026-01-01' }), completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-02' })]
    const atThreshold = [completedParticipation({ hoursLogged: 4, joinedDate: '2026-01-01' }), completedParticipation({ hoursLogged: 6, joinedDate: '2026-01-02' })]

    expect(findAchievement(computeAchievementsFromParticipations(below), 'a2').unlocked).toBe(false)
    expect(findAchievement(computeAchievementsFromParticipations(atThreshold), 'a2').unlocked).toBe(true)
  })

  // regression guard for the fix applied to services/achievements.js:
  // a3 is literally named "Completion of Three GROUP Activities" — it
  // must require opportunity.isGroup === true, not just any 3 completed
  // opportunities. Before the fix, this exact scenario (3 completed,
  // 0 of them group opportunities) incorrectly unlocked a3.
  it('does NOT unlock a3 for 3 completed opportunities when none of them are group opportunities', () => {
    const participations = [
      completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-01', isGroup: false }),
      completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-02', isGroup: false }),
      completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-03', isGroup: false }),
    ]
    const a3 = findAchievement(computeAchievementsFromParticipations(participations), 'a3')
    expect(a3.unlocked).toBe(false)
    expect(a3.progress).toEqual({ current: 0, target: 3 })
  })

  it('does not unlock a3 for only 2 completed group opportunities', () => {
    const participations = [
      completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-01', isGroup: true }),
      completedParticipation({ hoursLogged: 5, joinedDate: '2026-01-02', isGroup: true }),
    ]
    expect(findAchievement(computeAchievementsFromParticipations(participations), 'a3').unlocked).toBe(false)
  })

  it('unlocks a3 once 3 completed opportunities are group opportunities, and ignores non-group ones in the count', () => {
    const participations = [
      completedParticipation({ hoursLogged: 1, joinedDate: '2026-01-05', isGroup: false }), // does not count toward a3
      completedParticipation({ hoursLogged: 1, joinedDate: '2026-01-10', isGroup: true }),
      completedParticipation({ hoursLogged: 1, joinedDate: '2026-01-15', isGroup: true }),
      completedParticipation({ hoursLogged: 1, joinedDate: '2026-01-20', isGroup: true }),
    ]
    const a3 = findAchievement(computeAchievementsFromParticipations(participations), 'a3')
    expect(a3.unlocked).toBe(true)
    expect(a3.progress).toEqual({ current: 3, target: 3 })
    // earnedDate for a3 must be the earliest GROUP opportunity (2026-01-10),
    // not the earliest completed opportunity overall (2026-01-05, which is
    // not a group opportunity and is irrelevant to this specific achievement)
    expect(a3.earnedDate).toBe('2026-01-10')
  })

  it('uses the earliest completed date (regardless of group status) as earnedDate for a1/a2', () => {
    const participations = [
      completedParticipation({ hoursLogged: 6, joinedDate: '2026-03-01', isGroup: false }),
      completedParticipation({ hoursLogged: 6, joinedDate: '2026-01-01', isGroup: false }),
      completedParticipation({ hoursLogged: 6, joinedDate: '2026-02-01', isGroup: false }),
    ]
    const achievements = computeAchievementsFromParticipations(participations)
    expect(findAchievement(achievements, 'a1').earnedDate).toBe('2026-01-01')
    expect(findAchievement(achievements, 'a2').earnedDate).toBe('2026-01-01')
  })
})
