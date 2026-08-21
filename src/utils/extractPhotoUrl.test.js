import { describe, it, expect } from 'vitest'
import { extractPhotoUrl } from './extractPhotoUrl'

describe('extractPhotoUrl', () => {
  it('returns an empty string for null/undefined/falsy input', () => {
    expect(extractPhotoUrl(null)).toBe('')
    expect(extractPhotoUrl(undefined)).toBe('')
    expect(extractPhotoUrl('')).toBe('')
  })

  it('passes a plain string URL through unchanged', () => {
    expect(extractPhotoUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
  })

  it('extracts original_url from a raw Spatie Media object (the known backend bug shape)', () => {
    const rawMedia = { id: 1, original_url: 'https://example.com/media/photo.jpg', collection_name: 'profile_photo' }
    expect(extractPhotoUrl(rawMedia)).toBe('https://example.com/media/photo.jpg')
  })

  it('falls back to url when original_url is missing', () => {
    expect(extractPhotoUrl({ url: 'https://example.com/fallback.jpg' })).toBe('https://example.com/fallback.jpg')
  })

  it('prefers original_url over url when both are present', () => {
    expect(extractPhotoUrl({ original_url: 'https://a.test/a.jpg', url: 'https://a.test/b.jpg' })).toBe(
      'https://a.test/a.jpg',
    )
  })

  it('returns an empty string when the object has neither original_url nor url', () => {
    expect(extractPhotoUrl({ id: 1, collection_name: 'profile_photo' })).toBe('')
  })
})
