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


const GENDER_OPTIONS = ['Female', 'Male']

// قرار منتج مقصود: ما فينا نستبعد "ماجستير"/"دكتوراه" — مش منطقي حمَلة
// هالشهادتين يسجّلوا كمتطوّعين بمنصة تطوع أصلًا (سياق المنصة مختلف عن
// سياق توظيف أكاديمي). الفورم (ProfileForm.jsx) أصلًا بيخفيهم، وهون
// بنمنعهم على مستوى الـ schema كمان حتى ما يوصلوا كقيمة صالحة بأي طريق
const EDUCATION_LEVEL_OPTIONS = [
  'No Formal Education',
  'High School',
  'Diploma',
  "Bachelor's Degree",
]

const SYRIA_GOVERNORATES = [
  'Damascus',
  'Rif Dimashq',
  'Aleppo',
  'Homs',
  'Hama',
  'Latakia',
  'Tartus',
  'Idlib',
  'Raqqa',
  'Deir ez-Zor',
  'Al-Hasakah',
  'Daraa',
  'As-Suwayda',
  'Quneitra',
]

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