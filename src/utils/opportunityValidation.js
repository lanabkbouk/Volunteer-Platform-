// تحقق فورم إنشاء/تعديل الفرصة. نفس أسماء الحقول المستخدمة بـ ERD
// (title, description, category, governorate/city, dates, hours,
// needed volunteers, register window, skills)
// ⚠️ حقل نطاق العمر (minAge/maxAge) أُزيل بالكامل بناءً على طلب فريق
// الباك اند — التصنيف ما عاد فيه أي قيد عمري إطلاقًا.

import { z } from 'zod'

// يقارن بالتاريخ فقط (منتصف الليل)، بدون الوقت الدقيق — حتى "نفس يوم
// الإنشاء" يُقبل بدل ما يُرفض بسبب فرق ثوانٍ/ساعات بين وقت الإنشاء
// الفعلي ووقت إدخال startDate/registerStartAt بالفورم
function toDateOnly(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

// ⚠️ createdAt ثابت لازم يُمرَّر من الخارج، مش new Date() تُستدعى جوا
// الـ schema نفسها: الـ schema (وبالتالي resolver الفورم) بتُبنى مرة
// وحدة بس عند فتح الشاشة. لو اعتمدنا على new Date() اللحظية هون، كنا
// رح نقارن بلحظة *فتح* شاشة التعديل نفسها (تتغيّر كل مرة يفتحها
// المستخدم)، بدل لحظة *إنشاء* الفرصة الأصلية الثابتة طول عمرها —
// وهي المقارنة الصحيحة فعليًا (أدق من new Date() اللحظية).
export function createOpportunitySchema(createdAt = new Date()) {
  return z
    .object({
      title: z
        .string()
        .min(1, 'Title is required.')
        .min(3, 'Title must be at least 3 characters.')
        .max(255, 'Title must not exceed 255 characters.'),

      description: z
        .string()
        .min(1, 'Description is required.')
        .min(20, 'Description must be at least 20 characters.'),

      categoryId: z.string().min(1, 'Please select a category.'),

      city: z.string().min(1, 'Please select a governorate.'),

      // مهارات مطلوبة على الأقل واحدة — تُستخدم بخوارزمية اقتراح الفرص
      // للمتطوعين (حسب المهارات والمدينة)
      skills: z.array(z.string()).min(1, 'Please select at least one required skill.'),

      startDate: z.string().min(1, 'Start date is required.'),
      endDate: z.string().min(1, 'End date is required.'),

      // نافذة التسجيل: من متى لمتى يقدر المتطوع يسجّل بالفرصة
      registerStartAt: z.string().min(1, 'Registration start date is required.'),
      registerEndAt: z.string().min(1, 'Registration end date is required.'),

      minHours: z.coerce
        .number({ error: 'Minimum hours must be a valid number.' })
        .min(1, 'Minimum hours must be at least 1.'),
      maxHours: z.coerce
        .number({ error: 'Maximum hours must be a valid number.' })
        .min(1, 'Maximum hours must be at least 1.'),

      totalHours: z.coerce
        .number({ error: 'Total hours must be a valid number.' })
        .min(1, 'Total hours must be at least 1.'),

      minVolunteers: z.coerce
        .number({ error: 'Minimum volunteers must be a valid number.' })
        .int('Minimum volunteers must be a whole number.')
        .min(1, 'At least 1 volunteer is required.'),

      maxVolunteers: z.coerce
        .number({ error: 'Volunteers needed must be a valid number.' })
        .int('Volunteers needed must be a whole number.')
        .min(1, 'At least 1 volunteer is required.'),

      // حقل اختياري (افتراضيًا false) — يغذّي منطق إنجاز "3 أنشطة جماعية"
      // الموجود بالفعل بالباك اند (AchievementService::checkThreeGroupActivities)
      isGroup: z.boolean().optional().default(false),
    })
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
      message: 'End date must be on or after the start date.',
      path: ['endDate'],
    })
    .refine((data) => data.maxHours >= data.minHours, {
      message: 'Maximum hours must be greater than or equal to minimum hours.',
      path: ['maxHours'],
    })
    // totalHours هو مجموع ساعات الفرصة كلها (وليس لمتطوع واحد)، فلازم
    // يستوعب على الأقل حالة متطوع واحد ملتزم بالحد الأقصى (maxHours) —
    // وإلا فرصة بحد أقصى 6 ساعات للمتطوع بإجمالي ساعات أقل من 6 مستحيلة منطقيًا
    .refine((data) => data.totalHours >= data.maxHours, {
      message: 'Total hours must be at least the maximum hours per volunteer.',
      path: ['totalHours'],
    })
    .refine((data) => data.maxVolunteers >= data.minVolunteers, {
      message: 'Maximum volunteers must be greater than or equal to minimum volunteers.',
      path: ['maxVolunteers'],
    })
    .refine((data) => new Date(data.registerEndAt) >= new Date(data.registerStartAt), {
      message: 'Registration end date must be on or after the registration start date.',
      path: ['registerEndAt'],
    })
    .refine((data) => new Date(data.registerEndAt) <= new Date(data.startDate), {
      message: 'Registration must close on or before the opportunity start date.',
      path: ['registerEndAt'],
    })
    // قيدان إضافيان مرتبطان بـ createdAt (قيمة خارجية عن الفورم نفسه) —
    // .refine() العادية بتتحقق فقط من حقول الكائن الممرَّر لها، فاستخدمنا
    // .superRefine() هون عشان تقدر تضيف أكثر من issue بنفس القيد الواحد
    // لو احتجنا لاحقًا، وللوضوح مع بقية الأخطاء المخصّصة بالملف
    //
    // ⚠️ endDate وregisterEndAt عمدًا بدون قيد مباشر مع createdAt هون:
    // endDate >= startDate (refine فوق) وstartDate >= createdAt (تحت)
    // يضمنان تلقائيًا إن endDate >= createdAt (تسلسل رياضي: transitivity).
    // نفس الشي لـ registerEndAt >= registerStartAt (refine فوق) مع
    // registerStartAt >= createdAt (تحت) — قيد مباشر إضافي عليهم كان
    // رح يكون تكرارًا رياضيًا زائدًا، مش قيدًا فعليًا جديدًا
    .superRefine((data, ctx) => {
      const createdAtDateOnly = toDateOnly(createdAt)

      if (toDateOnly(data.startDate) < createdAtDateOnly) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date cannot be earlier than the opportunity's creation date.",
          path: ['startDate'],
        })
      }

      if (toDateOnly(data.registerStartAt) < createdAtDateOnly) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Registration start date cannot be earlier than the opportunity's creation date.",
          path: ['registerStartAt'],
        })
      }
    })
}

// نسخة افتراضية (createdAt = لحظة الاستيراد) — للتوافق مع أي كود قديم
// كان يستورد opportunitySchema مباشرة. الفورم الفعلي (CreateEditCause)
// لازم يبني نسخته الخاصة عبر createOpportunitySchema(createdAt) بدل
// الاعتماد على هاي النسخة الثابتة، حتى تنعكس createdAt الصحيحة حسب
// وضع create/edit
export const opportunitySchema = createOpportunitySchema()

export function parseOpportunityForm(values, createdAt = new Date()) {
  return createOpportunitySchema(createdAt).safeParse(values)
}
