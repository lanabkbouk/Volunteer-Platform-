import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { profileSchema } from './VolunteerProfileValidation'

// calculateAge (المستخدمة جوا dateOfBirth.refine) بتعتمد new Date()
// الحقيقي — نثبّت الساعة حتى "18 سنة بالضبط" تضل نتيجة ثابتة بغض النظر
// عن تاريخ تشغيل الاختبار الفعلي
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T00:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

function validPayload(overrides = {}) {
  return {
    educationLevel: 'Bachelor\'s Degree',
    dateOfBirth: '2000-01-01', // 26 years old at the fixed "now" above
    gender: 'Male',
    city: 'Damascus',
    skills: ['s1'],
    interests: '',
    about: '',
    ...overrides,
  }
}

describe('profileSchema', () => {
  it('accepts a fully valid volunteer profile', () => {
    const result = profileSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it('accepts "Rif Dimashq" as a valid governorate value (the exact string the API expects)', () => {
    const result = profileSchema.safeParse(validPayload({ city: 'Rif Dimashq' }))
    expect(result.success).toBe(true)
  })

  it('rejects "Rural Damascus" — only the transformed "Rif Dimashq" value is accepted', () => {
    const result = profileSchema.safeParse(validPayload({ city: 'Rural Damascus' }))
    expect(result.success).toBe(false)
  })

  it('rejects an unknown governorate', () => {
    const result = profileSchema.safeParse(validPayload({ city: 'Atlantis' }))
    expect(result.success).toBe(false)
  })

  it('rejects a missing educationLevel with a custom, non-default message', () => {
    const result = profileSchema.safeParse(validPayload({ educationLevel: '' }))
    expect(result.success).toBe(false)
    expect(result.error.issues[0].message).toBe('Please select your education level.')
  })

  it('rejects education levels excluded by design (e.g. a Master\'s degree)', () => {
    const result = profileSchema.safeParse(validPayload({ educationLevel: "Master's Degree" }))
    expect(result.success).toBe(false)
  })

  it('rejects a gender outside the allowed Female/Male set', () => {
    const result = profileSchema.safeParse(validPayload({ gender: 'Prefer not to say' }))
    expect(result.success).toBe(false)
  })

  it('rejects a volunteer younger than 18', () => {
    // exactly 17 at the fixed "now" (2026-06-15)
    const result = profileSchema.safeParse(validPayload({ dateOfBirth: '2009-01-01' }))
    expect(result.success).toBe(false)
  })

  it('accepts a volunteer whose 18th birthday is exactly today', () => {
    const result = profileSchema.safeParse(validPayload({ dateOfBirth: '2008-06-15' }))
    expect(result.success).toBe(true)
  })

  it('rejects an empty skills array', () => {
    const result = profileSchema.safeParse(validPayload({ skills: [] }))
    expect(result.success).toBe(false)
  })

  it('treats interests/about as optional', () => {
    const payload = validPayload()
    delete payload.interests
    delete payload.about
    const result = profileSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })
})
