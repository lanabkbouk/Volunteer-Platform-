// نقطة واحدة لتتبّع آخر status شافته *المنظمة* لكل مشاركة من مشاركات
// فرصها (عكس participationStatusSeenTracker.js يلي من منظور المتطوع
// نفسه). يُستخدم لاكتشاف نشاط جديد لسا ما انشاف: "متقدّم جديد"
// (pending) أو "انسحاب" (withdrawn) — راجع services/notifications.js
// → buildApplicantActivityItems

const SEEN_KEY = "organization:seenApplicantStatus";

export function getSeenApplicantStatusMap() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
  } catch {
    return new Map();
  }
}

export function markApplicantStatusSeen(participationId, status) {
  const current = getSeenApplicantStatusMap();
  current.set(participationId, status);

  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Object.fromEntries(current)));
  } catch {
    // تجاهل أي خطأ تخزين (وضع التصفح الخاص، أو تجاوز الحصة المسموحة)
  }
}