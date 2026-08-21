// src/constants/educationLevels.js
//
// مصدر وحيد لمستويات التعليم المسموحة بتسجيل متطوع — يُشتق منه كل من
// schema التحقق (VolunteerProfileValidation.js) وخيارات القائمة المنسدلة
// (volunteerProfile/ProfileForm.jsx)، بدل تكرار نفس القيم الأربع بملفين
// منفصلين (خطر انحراف مستقبلي لو تغيّرت القائمة بمكان وما تحدّث بالتاني).
//
// قرار منتج مقصود: "ماجستير"/"دكتوراه" مستبعدتان عمدًا — مش منطقي حمَلة
// هالشهادتين يسجّلوا كمتطوّعين بمنصة تطوع أصلًا (سياق المنصة مختلف عن
// سياق توظيف أكاديمي).
export const EDUCATION_LEVELS = [
  'No Formal Education',
  'High School',
  'Diploma',
  "Bachelor's Degree",
]
