// utils/achievementNotificationSeenTracker.js
//
// يتتبّع أي إنجاز اتعلّم "مقروء" صراحة من تنبيه الجرس/صفحة /notifications
// (ضغطة X أو Mark as read أو فتح التنبيه نفسه) — منفصل تمامًا عن
// achievementSeenTracker.js (يلي بيتحكم بمودال الاحتفال "Achievement
// Unlocked!" بصفحة My Journey، ويُعلَّم تلقائيًا بعد أول عرض للمودال).
//
// ⚠️ قبل هالفصل، كان التراكر نفسه مستخدَم للغرضين معًا: مجرد زيارة
// My Journey (يلي بتعرض المودال) كانت تُسقط تنبيه الإنجاز من الجرس
// بصمت، حتى لو المستخدم ما فتح التنبيه ولا ضغط Mark as read إطلاقًا.
// هلق: التنبيه يضل ظاهر لحد ما يُعلَّم صراحة، بغض النظر شو صار بمودال
// الاحتفال.

const SEEN_KEY = "achievements:notificationSeenIds";

export function getSeenAchievementNotificationIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markAchievementNotificationIdsSeen(ids) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // تجاهل أي خطأ تخزين (وضع التصفح الخاص، أو تجاوز الحصة المسموحة)
  }
}
