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
import { calculateAge } from '../validators'
import { EDUCATION_LEVELS } from '../../constants/educationLevels'
import { SYRIAN_GOVERNORATES } from '../../services/syrianGovernorates'


const GENDER_OPTIONS = ['Female', 'Male']

// مصدر واحد مشترك مع volunteerProfile/ProfileForm.jsx — راجع
// constants/educationLevels.js لسبب استبعاد ماجستير/دكتوراه
const EDUCATION_LEVEL_OPTIONS = EDUCATION_LEVELS

// نفس تحويل nameEn -> value المستخدم فعليًا بالـ select (GOVERNORATE_ITEMS
// بـ volunteerProfile/ProfileForm.jsx) ومطابق لنفس الاشتقاق المستخدم بـ
// OrganizationProfileValidation.js — قائمة واحدة مشتقة من المصدر الإداري
// الوحيد (syrianGovernorates.js) بدل نسخة ثانية يدوية ممكن تنحرف عنها
// بالمستقبل (متل ما كان الحال هون سابقًا)
const SYRIA_GOVERNORATES = SYRIAN_GOVERNORATES.map(({ nameEn }) =>
  nameEn === 'Rural Damascus' ? 'Rif Dimashq' : nameEn,
)

const requiredSelect = (options, message) =>
  z
    .string()
    .min(1, message)
    .refine((value) => options.includes(value), message)

export const profileSchema = z.object({
  educationLevel: requiredSelect(EDUCATION_LEVEL_OPTIONS, 'Please select your education level.'),

  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required.')
    .refine((value) => {
      const age = calculateAge(value)
      return age !== null && age >= 18
    }, 'You must be at least 18 years old to register as a volunteer.'),

  gender: requiredSelect(GENDER_OPTIONS, 'Please select your gender.'),

  // كانت غير موجودة أصلًا بالـ schema رغم وجودها بالفورم — كان ممكن
  // تُحفظ فارغة بدون أي خطأ. هلق إجبارية متل باقي البروفايل.
  city: requiredSelect(SYRIA_GOVERNORATES, 'Please select your governorate.'),

  // Array of skill IDs — at least one is required
  skills: z.array(z.string()).min(1, 'Please select at least one skill.'),

  // الوحيدان الاختياريان بالبروفايل بقرار صريح
  interests: z.string().optional(),
  about: z.string().optional(),
})

export function parseProfileForm(values) {
  return profileSchema.safeParse(values)
}