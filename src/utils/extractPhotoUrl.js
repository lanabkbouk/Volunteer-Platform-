// src/utils/extractPhotoUrl.js
//
// دالة استخراج رابط صورة نصي من أي قيمة خام قادمة من VolunteerResource
// بالباك اند — سواء رابط نصي جاهز، أو كائن Media خام (باگ مؤكَّد بالباك
// اند: 'photo' => getFirstMedia() بترجع كائن Media كامل (Spatie) مش رابط
// نصي، بعكس OrganizationResource الصحيحة). نقطة واحدة مشتركة بدل تكرار
// نفس المعالجة الدفاعية بكل مكان يعرض صورة متطوع — سواء بروفايله الشخصي
// (normalizeUser.js) أو بطاقته كمتقدّم عند منظمة (services/participations.js)،
// لأن كلاهما يمر بنفس VolunteerResource المصاب.
//
// بدون هالمعالجة، تمرير كائن خام كـ src لمكوّن Avatar يكسره فعليًا
// (src.startsWith is not a function) بدل عرض الفولباك بشكل سليم.
export function extractPhotoUrl(raw) {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  // كائن Media خام (باگ الباك اند أعلاه) — محاولة دفاعية أخيرة
  return raw.original_url || raw.url || ''
}
