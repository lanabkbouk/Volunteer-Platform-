// نقطة واحدة لتتبّع أي منظمات "معلّقة" (Pending) شافها الأدمن مسبقًا
// بجرس الإشعارات، عبر localStorage. نفس فلسفة achievementSeenTracker.js
// (Set من المعرّفات، بلا Map/status) — بس مستقل تمامًا عن
// organizationVerificationSeenTracker.js الموجود أصلًا، لأن ذاك مخصص
// لسياق مختلف كليًا: تتبّع المنظمة نفسها لآخر قرار توثيق (verified/
// rejected) شافته لحسابها هي (مفتاح واحد، Map<id,status>). هون العكس:
// تتبّع الأدمن لأي منظمات pending شافها هو (مفتاح واحد كمان، بس Set
// بسيط لأن "pending" حالة واحدة بلا تفرّع status متعدد يحتاج تخزينه)

const SEEN_KEY = "admin:seenPendingOrganizationIds";

export function getSeenPendingOrganizationIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markPendingOrganizationSeen(organizationId, updatedSet) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...updatedSet]));
  } catch {
    // تجاهل أي خطأ تخزين (وضع التصفح الخاص، أو تجاوز الحصة المسموحة)
  }
}
