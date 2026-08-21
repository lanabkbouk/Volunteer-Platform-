import { describe, it, expect } from 'vitest'
import { organizationProfileSchema } from './OrganizationProfileValidation'

function validPayload(overrides = {}) {
  return {
    name: 'Blue Drop Foundation',
    description: 'We provide clean water access to underserved communities.',
    city: 'Damascus',
    website: 'https://example.org',
    ...overrides,
  }
}

describe('organizationProfileSchema', () => {
  it('accepts a fully valid organization profile', () => {
    const result = organizationProfileSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it('accepts "Rif Dimashq" as a valid governorate value, matching the volunteer schema exactly', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ city: 'Rif Dimashq' }))
    expect(result.success).toBe(true)
  })

  it('rejects "Rural Damascus" — only the transformed "Rif Dimashq" value is accepted', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ city: 'Rural Damascus' }))
    expect(result.success).toBe(false)
  })

  it('rejects a missing name', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ name: '' }))
    expect(result.success).toBe(false)
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ name: 'A' }))
    expect(result.success).toBe(false)
  })

  it('rejects a description shorter than 10 characters', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ description: 'too short' }))
    expect(result.success).toBe(false)
  })

  it('rejects a malformed website URL', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ website: 'not-a-url' }))
    expect(result.success).toBe(false)
  })

  it('treats an empty website string as valid (optional field)', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ website: '' }))
    expect(result.success).toBe(true)
  })

  it('treats a missing website field as valid (optional field)', () => {
    const payload = validPayload()
    delete payload.website
    const result = organizationProfileSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects an unknown governorate', () => {
    const result = organizationProfileSchema.safeParse(validPayload({ city: 'Atlantis' }))
    expect(result.success).toBe(false)
  })
})
