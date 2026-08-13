# تقرير: ربط نظام التنبيهات مع الباك اند (Laravel)

**الجمهور المستهدف:** فريق الباك اند.
**الحالة الحالية:** نظام التنبيهات بالفرونت يشتغل بالكامل بوضع Mock (بدون أي endpoint حقيقي). هالتقرير بيشرح الشكل المتوقع من الـ API حتى الربط يصير بأقل تعديل ممكن على الفرونت.

---

## 1. ملخص الوضع الحالي بالفرونت

كل منطق التنبيهات مركّز بملف واحد: `src/services/notifications.js`. بوضع الـ Mock، التنبيهات مش مخزّنة فعليًا — بتُشتق لحظيًا من بيانات موجودة أصلًا (إنجازات، مشاركات، توثيق منظمة...) بمقارنتها مع آخر قيمة "شافها" المستخدم (محفوظة بـ localStorage). هاي الآلية بديل مؤقت لعدم وجود جدول تنبيهات حقيقي بالباك — **ومن المتوقع تُستبدل بالكامل** بعد الربط.

الجلب يصير بـ polling كل 5 ثواني (`src/hooks/useRecentUpdates.js`) + عند كل تنقّل صفحة. التطبيع الدفاعي الموجود أصلًا بالفرونت (`services/notifications.js`) بيتوقع من الاستجابة:

```js
{ id, type, title, description, href, seen }
```

مع Fallbacks لأسماء حقول بديلة (`message` بدل `description`، `link` بدل `href`) — **بس الأفضل الالتزام بالأسماء أعلاه مباشرة** لتفادي أي التباس مستقبلي.

---

## 2. كتالوج أنواع التنبيهات الحالية

جدول بكل الأنواع الثمانية المُولَّدة حاليًا بالفرونت (Mock)، مطلوب من الباك اند توليد نفس المعنى:

| `type` | الحدث المُطلِق | يخص | الوجهة (`href`) |
|---|---|---|---|
| `achievement` | إنجاز جديد اتفتح للمتطوع | متطوع | `/my-journey` |
| `hours` | المنظمة أكّدت ساعات تطوّع | متطوع | `/my-volunteering` |
| `status-accepted` | طلب المشاركة اتقبل | متطوع | `/my-volunteering` |
| `status-rejected` | طلب المشاركة انرفض | متطوع | `/my-volunteering` |
| `org-verified` | الأدمن وثّق المنظمة | منظمة | `/organization-profile` |
| `org-rejected` | الأدمن رفض توثيق المنظمة | منظمة | `/organization-profile` |
| `applicant-withdrawn` | متطوع انسحب من فرصة تخص المنظمة | منظمة | `/my-causes/applicants/{opportunityId}` |
| `opportunity-reminder` | فرصة مقبولة بتبلّش خلال يومين | متطوع | `/my-volunteering` |

> ملاحظة بخصوص `opportunity-reminder`: هاد النوع الوحيد اللي مش مبني على "حدث" واضح، إنما على نافذة زمنية (يومين قبل البدء — القيمة بالضبط بـ `src/utils/opportunityStatus.js: getDaysUntilStart`, ثابت `TWO_DAYS_MS`). لو الباك اند رح يتولّى توليده، لازم يشتغل بنفس المنطق: Scheduled Command (يومي أو كل ساعة) يفحص المشاركات المقبولة اللي `start_date` فرصتها ضمن 48 ساعة القادمة ولسا ما انولّد لها تنبيه.

---

## 3. الشكل المقترح لقاعدة البيانات

**التوصية:** استخدام نظام Laravel Notifications الجاهز (`database` notification channel + `Notifiable` trait) بدل تصميم جدول مخصص من الصفر — بيوفّر جاهز تقريبًا كل الشكل المطلوب:

```
php artisan notifications:table
php artisan migrate
```

بينشئ جدول `notifications` بالأعمدة:

```
id (uuid, PK)
type            -- اسم الـ Notification class بالباك (مش نفس حقل type بالجدول أدناه — راجع ملاحظة تحت)
notifiable_type / notifiable_id  -- polymorphic: User أو Organization
data (json)
read_at (nullable timestamp)
created_at / updated_at
```

**عقد حقل `data` (JSON) المتوقع من الفرونت:**

```json
{
  "notificationType": "status-accepted",
  "title": "Your request was accepted",
  "description": "Beach Cleanup Day",
  "href": "/my-volunteering"
}
```

استخدمنا `notificationType` جوا `data` (مش `type` مباشرة) لتفادي التعارض مع عمود `type` الجاهز من Laravel (اللي بيخزّن اسم الـ PHP class، مثلاً `App\Notifications\ParticipationAccepted`) — الفرونت بيحتاج القيمة القصيرة (`status-accepted`) لعرض الأيقونة/اللون الصحيح (`src/constants/notificationTypes.js`)، فلازم backend يمررها ضمن `data.notificationType` أو أي مفتاح متفق عليه، والفرونت هيك بيقرأها.

---

## 4. الـ Endpoints المطلوبة

```
GET  /api/notifications
     -> Paginated, sorted by created_at DESC
     -> Response: Laravel API Resource envelope عادي (data/meta/links —
        الفرونت أصلًا بيفكّه تلقائيًا بـ services/api/client.js:unwrapLaravelEnvelope)

POST /api/notifications/{id}/read
     -> يضبط read_at = now() لعنصر واحد

POST /api/notifications/read-all
     -> يضبط read_at = now() لكل تنبيهات المستخدم الحالي غير المقروءة
```

كل الـ Endpoints محمية بنفس الـ Auth Middleware المستخدم بباقي الـ API (Bearer token — الفرونت أصلًا بيرسله تلقائيًا بكل طلب عبر `apiClient` interceptor).

---

## 5. متى يتولّد كل نوع (اقتراح لمكان التوليد بالباك)

| `type` | مكان التوليد المقترح |
|---|---|
| `achievement` | عند فتح إنجاز (Observer/Event على جدول الإنجازات) |
| `hours` | عند تأكيد المنظمة لساعات المشاركة (نفس الـ Endpoint اللي بيحدّث `hoursLogged`) |
| `status-accepted` / `status-rejected` | عند تحديث حالة المشاركة (Participation Controller) |
| `org-verified` / `org-rejected` | عند قرار الأدمن بمراجعة توثيق المنظمة |
| `applicant-withdrawn` | عند انسحاب متطوع من مشاركة (Withdraw Endpoint) — يوصل لصاحب الفرصة (المنظمة) |
| `opportunity-reminder` | Scheduled Command (راجع ملاحظة القسم 2) |

---

## 6. تحسين مستقبلي اختياري (مو شرط لأول ربط)

الـ Polling الحالي (كل 5 ثواني) هيضل شغّال تمام مع الـ Endpoint الحقيقي بدون أي تعديل. لو حبيتوا لاحقًا تحديث فوري بدل التأخير البسيط، البديل المتوافق مع Laravel هو **Laravel Echo + Pusher (أو Reverb)** — بس هاد قرار منفصل ومؤجّل، مش جزء من هالمرحلة.

---

## 7. نقطة الدمج بالفرونت — التأثير المتوقع صفر تقريبًا

كل منطق الجلب موجود أصلًا بفرع جاهز بـ `services/notifications.js` (`fetchRecentNotifications`)، وكل مكوّنات العرض (`NotificationBell.jsx`, `pages/notifications.jsx`) بتستهلك نفس الشكل الموحّد بغض النظر عن المصدر (Mock أو API). التبديل الفعلي، لما الـ Endpoint يصير جاهز، بيصير **بهالملف فقط**:

- تفعيل فرع `apiClient.get('/notifications')` (موجود أصلًا، معطّل بوضع Mock).
- تعديل التطبيع (`item.type` → `item.data.notificationType` حسب الشكل النهائي المتفق عليه فعليًا).
- ربط `onDismiss` لكل عنصر بـ `POST /notifications/{id}/read` (موجود أصلًا بالكود كـ placeholder).

بدون أي لمسة على `NotificationBell.jsx`، `pages/notifications.jsx`، أو `useRecentUpdates.js`.

---

## 8. قائمة تنظيف مؤجّلة (بعد الربط الفعلي فقط)

بعد ما يصير `read_at` من الباك هو مصدر الحقيقة الوحيد لـ"مقروء"، الملفات التالية بتصير غير لازمة وقابلة للحذف بالكامل (حاليًا هي الآلية الوحيدة المتوفرة بوضع Mock، فما لازم تُحذف قبل هيك):

- `src/utils/achievementSeenTracker.js`
- `src/utils/hoursSeenTracker.js`
- `src/utils/participationStatusSeenTracker.js`
- `src/utils/organizationVerificationSeenTracker.js`
- `src/utils/organizationApplicantSeenTracker.js`

بالإضافة لمواقع استدعائها بـ `pages/participates.jsx`, `pages/orgProfile.jsx`, `pages/applicantsList.jsx` (السطور اللي بتنادي `markHoursSeen`/`markStatusSeen`/... عند زيارة كل صفحة).
