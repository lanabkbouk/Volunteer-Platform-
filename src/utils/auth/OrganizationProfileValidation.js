// utils/auth/OrganizationProfileValidation.js
//
// تحقق فورم بروفايل المنظمة. لاحظي: "verification document" مش موجود
// هون قصدًا — هو حقل خاص بصفحة التسجيل فقط (مرة وحدة)، مو بالتعديل اللاحق.

/**
 * Validation Guideline:
 * All select fields in profile pages (organization & volunteer)
 * must use custom error messages such as:
 *   - "Please select your governorate."
 *   - "Please select a category."
 *
 * Do NOT use Zod's default enum error messages.
 * This rule ensures consistent UX across all profile forms.
 */

import { z } from 'zod'
import { SYRIAN_GOVERNORATES } from '../../services/syrianGovernorates'

// نفس تحويل nameEn -> value المستخدم فعليًا بالـ select (راجع GOVERNORATE_ITEMS
// بـ components/OrgProfile/ProfileForm.jsx) — "Rural Damascus" بيترسل كـ
// "Rif Dimashq"، فلازم قائمة التحقق تطابق القيم الحقيقية يلي الفورم بيرسلها
// تمامًا، بدل نسخة ثانية يدوية ممكن تنحرف عنها بالمستقبل (متل ما صار هون).
const SYRIA_GOVERNORATES = SYRIAN_GOVERNORATES.map(({ nameEn }) =>
  nameEn === 'Rural Damascus' ? 'Rif Dimashq' : nameEn,
)

const requiredSelect = (options, message) =>
  z
    .string()
    .min(1, message)
    .refine((value) => options.includes(value), message)

export const organizationProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required.')
    .min(2, 'Organization name must be at least 2 characters.')
    .max(255, 'Organization name must not exceed 255 characters.'),

  description: z
    .string()
    .min(1, 'Organization description is required.')
    .min(10, 'Organization description must be at least 10 characters.'),

  city: requiredSelect(SYRIA_GOVERNORATES, 'Please select your governorate.'),

  website: z
    .string()
    .url('Please enter a valid website URL (e.g. https://example.org).')
    .optional()
    .or(z.literal('')),
})

export function parseOrganizationProfileForm(values) {
  return organizationProfileSchema.safeParse(values)
}