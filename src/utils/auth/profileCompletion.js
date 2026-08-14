// utils/auth/profileCompletion.js
//
// نقطة واحدة لتحديد هل بروفايل المتطوع "مكتمل" أو لأ.
//
// ⚠️ سابقًا كنا نعتمد على علم واحد جاهز (user.profileCompleted)، بس
// هذا العلم كان يُضبط يدويًا بالفرونت بس (وضع mock)، والباك اند
// الحقيقي أصلًا ما بيرجّعه بأي استجابة (login / /volunteers/me) —
// يعني بوضع real كان بيضل undefined للأبد، وأي متطوع حقيقي كان رح
// ينحبس بصفحة البروفايل حتى لو عبّاها صح.
//
// الحل: نفحص الحقول الفعلية المطلوبة مباشرة على كائن المستخدم، بدل
// الاعتماد على علم قد لا يوصل من الباك اند أبدًا. هاد بيخلي الفحص
// شغّال بنفس الطريقة تمامًا بوضعي mock وreal معًا، بدون أي فرق سلوك.
//
// ⚠️ القائمة هون لازم تبقى مطابقة تمامًا للحقول الإجبارية بـ
// profileSchema (utils/auth/VolunteerProfileValidation.js). لو
// أضفتِ/حذفتِ حقل إجباري هناك، حدّثي هون كمان بنفس الوقت.
export function isVolunteerProfileComplete(user) {
  if (!user) return false

  const hasEducationLevel = Boolean(user.educationLevel)
  const hasDateOfBirth = Boolean(user.dateOfBirth || user.dob)
  const hasGender = Boolean(user.gender)
  const hasCity = Boolean(user.city)
  const hasSkills = Array.isArray(user.skillIds) && user.skillIds.length > 0

  // interests وabout اختياريان بالـ schema، فما منشترطهم هون
  return hasEducationLevel && hasDateOfBirth && hasGender && hasCity && hasSkills
}

// نقطة واحدة لتحديد هل بروفايل المنظمة "مكتمل" أو لأ — تذكير غير مانع بس،
// ومش مرتبط بـ RequireCompleteProfile (هاد المكوّن خاص بالمتطوع حصرًا ولا
// يُستخدم مع المنظمة إطلاقًا).
//
// ⚠️ القائمة هون لازم تبقى مطابقة تمامًا للحقول الإجبارية بـ
// organizationProfileSchema (utils/auth/OrganizationProfileValidation.js)
// ما عدا website (اختياري بالـ schema، فما منشترطه هون).
export function isOrganizationProfileComplete(organization) {
  if (!organization) return false

  const hasDescription = Boolean(organization.description)
  const hasCity = Boolean(organization.city)

  return hasDescription && hasCity
}