import { getUserDisplayName } from './displayName'

//  الباك اند الحقيقي (UserResource.php) بيرجّع صورة المتطوع/المنظمة
// متداخلة جوا user.volunteer.photo أو user.organization.profile_image —
// مش حقل مسطّح imageUrl زي وضع Mock. هالدالة بتوحّد الشكلين لحقل واحد.
//
//  باگ مؤكَّد بالباك اند (VolunteerResource.php): 'photo' => getFirstMedia(...)
// بترجع كائن Media كامل (Spatie)، مش رابط نصي — بعكس OrganizationResource
// يلي صح (getFirstMediaUrl). لحد ما يتصلّح (getFirstMedia → getFirstMediaUrl)،
// بنتعامل دفاعيًا: لو وصل كائن بدل نص، نجرّب original_url (خاصية Spatie
// القياسية) وإلا نتجاهله بدل ما نعرض [object Object] كرابط صورة مكسور
function extractRealPhotoUrl(rawUser) {
  const volunteerPhoto = rawUser.volunteer?.photo
  const organizationPhoto = rawUser.organization?.profile_image
  const raw = volunteerPhoto ?? organizationPhoto

  if (!raw) return ''
  if (typeof raw === 'string') return raw
  // كائن Media خام (باگ الباك اند أعلاه) — محاولة دفاعية أخيرة
  return raw.original_url || raw.url || ''
}

/**
 * نقطة التطبيع الوحيدة لبيانات المستخدم في كامل التطبيق.
 * تُستدعى مرة واحدة فقط، مباشرة بعد استقبال استجابة تسجيل الدخول/التسجيل
 * (داخل services/auth.js)، وتُنتج شكلًا ثابتًا يعتمد عليه AuthContext وكل الـ Components.
 *
 */
export function normalizeUser(rawUser) {
  if (!rawUser || typeof rawUser !== 'object') return null

  return {
    ...rawUser,
    // اسم جاهز للعرض دائمًا، بنفس منطق getUserDisplayName لكن محسوب مرة واحدة فقط
    displayName: getUserDisplayName(rawUser),
    // صورة جاهزة للعرض. ⚠️ لازم نتحقق من *وجود* المفتاح imageUrl فعليًا
    // (!== undefined)، مش من قيمته الصح/فولسي (|| كان هون) — لما المستخدم
    // يزيل صورته، updateUser بـ AuthContext بيمرّر imageUrl: '' صراحة،
    // بس بما إنه current.user (المدموج معه بنفس الدالة) عنده أصلًا
    // avatarUrl القديم محسوب من نداء سابق، سلسلة || كانت تتجاوز '' الفارغة
    // (فولسي) وترجع avatarUrl القديم — يعني الصورة تختفي من الفورم بس
    // تضل عالقة بالـ Navbar لنفس الجلسة (تختفي بس بعد reload كامل). لو
    // imageUrl موجود كمفتاح صراحة (حتى لو فارغ)، هو الأحدث دايمًا ونستخدمه
    // كما هو؛ نطلع من avatarUrl/الشكل المتداخل الحقيقي بس لو غير موجود إطلاقًا
    avatarUrl: rawUser.imageUrl !== undefined ? rawUser.imageUrl : rawUser.avatarUrl || extractRealPhotoUrl(rawUser),
   
    phone: rawUser.phone_number || rawUser.phone || '',
  }
}