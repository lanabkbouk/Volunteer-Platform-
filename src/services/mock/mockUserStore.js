import { MOCK_USERS_STORAGE_KEY } from '../../constants/auth/storage'
import { ACCOUNT_TYPES } from '../../constants/auth/accountTypes'

// حساب أدمن افتراضي بوضع mock فقط — الأدمن ما إله شاشة تسجيل عامة
// (قرار مقصود، راجع constants/auth/accountTypes.js)، فبدون حساب جاهز
// هون ما في أي طريقة لاختبار تسجيل دخول أدمن بوضع mock إطلاقًا.
// بوضع real: الحساب الفعلي يُنشأ يدويًا بالباك اند (Seeder/Tinker)،
// وهاي القيمة ما إلها أي أثر.
const DEFAULT_MOCK_ADMIN = {
  email: 'admin@volunteer.test',
  password: 'Admin@123',
  accountType: ACCOUNT_TYPES.ADMIN,
  firstName: 'Platform',
  lastName: 'Admin',
}

// ⚠️ حارس أمان ثانٍ ومستقل — لا نعتمد فقط على VITE_API_MODE (متغير
// بيئة قابل للنسيان عند النشر: لو نُسي ضبطه بالخادم، isMockMode()
// ترجع mock افتراضيًا وحساب الأدمن هذا يصير فعليًا شغّالًا على موقع
// حقيقي منشور). import.meta.env.DEV علم مدمج بـ Vite نفسه، يساوي
// true فقط بوضع التطوير المحلي (npm run dev)، وfalse تلقائيًا بأي
// Build إنتاجي حقيقي (npm run build) بغض النظر عن أي متغير بيئة آخر —
// فحتى لو نُسي ضبط VITE_API_MODE، هذا الحساب لا يمكن أن يظهر بأي بناء
// إنتاجي مطلقًا
//
// بيئات المعاينة (مثل نشرات Vercel قبل ربط الباك اند الحقيقي) مش
// "تطوير محلي" بمعنى import.meta.env.DEV، لكن لسا مش إنتاج حقيقي —
// فبنسمح بتفعيل الحساب الوهمي فيها فقط عبر متغير بيئة صريح ومقصود
// (VITE_ENABLE_MOCK_ADMIN=true بإعدادات المشروع على Vercel)، بدل ما
// يكون شغّال افتراضيًا. لازم يُزال هذا المتغير لما يترّبط الباك اند
// الحقيقي (عندها VITE_API_MODE=real أصلًا بيعطّل فرع الـ Mock كله).
const IS_LOCAL_DEV = Boolean(import.meta.env.DEV)
const IS_MOCK_ADMIN_ENABLED = IS_LOCAL_DEV || import.meta.env.VITE_ENABLE_MOCK_ADMIN === 'true'

// قراءة قائمة المستخدمين الوهميين من التخزين المحلي — نضمن دايمًا
// وجود حساب أدمن واحد بالقائمة حتى لو التخزين فاضي بالكامل أو ما
// فيه أدمن بعد (بدون تخزينه فعليًا بـ localStorage، فقط نُلحقه لحظة
// القراءة، فهو موجود دايمًا وجاهز للاختبار) — لكن فقط لما يكون الحساب
// الوهمي مفعّل، راجع تعليق IS_MOCK_ADMIN_ENABLED أعلاه
export function loadMockUsers() {
  try {
    const raw = localStorage.getItem(MOCK_USERS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const users = Array.isArray(parsed) ? parsed : []

    if (!IS_MOCK_ADMIN_ENABLED) return users

    const hasAdmin = users.some((user) => user.accountType === ACCOUNT_TYPES.ADMIN)
    return hasAdmin ? users : [...users, DEFAULT_MOCK_ADMIN]
  } catch {
    return IS_MOCK_ADMIN_ENABLED ? [DEFAULT_MOCK_ADMIN] : []
  }
}

// حفظ قائمة المستخدمين الوهميين كاملة
export function saveMockUsers(users) {
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users))
}

// تحديث حقول مستخدم وهمي محدد عبر البريد الإلكتروني، وإرجاع النسخة المحدَّثة
export function updateMockUser(email, updates) {
  const users = loadMockUsers()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const index = users.findIndex((user) => user.email === normalizedEmail)

  if (index === -1) return null

  const updatedUser = { ...users[index], ...updates }
  users[index] = updatedUser
  saveMockUsers(users)

  return updatedUser
}