import { ACCOUNT_TYPES } from '../constants/auth/accountTypes'
import { apiClient, getApiErrorMessage, getApiFieldErrors } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { normalizeUser } from '../utils/auth/normalizeUser'
import { validateAuthResponse } from '../utils/api/apiResponseSchemas'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { ROUTES } from '../constants/paths'
import { loadMockUsers, saveMockUsers, updateMockUser } from './mock/mockUserStore'
import { generateResetToken, consumeResetToken } from './mock/mockPasswordResetStore'

const MOCK_MODE = isMockMode()

// إيميل المستخدم المسجّل دخوله حاليًا — نفس النمط المستخدم بـ
// services/organization.js وservices/volunteer.js لتحديد أي مستخدم
// وهمي نعدّل عليه بوضع الـ Mock بدون ما نطلب من الصفحة تمرير الإيميل
// الحالي بكل استدعاء
function getCurrentSessionEmail() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user?.email || null
  } catch {
    return null
  }
}

// إزالة كلمة المرور من بيانات المستخدم قبل تخزينها في الـ Context
function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

// استخراج ملف واحد سواء وصل كـ FileList (من react-hook-form) أو كـ File مباشرة
function extractFile(value) {
  if (typeof FileList !== 'undefined' && value instanceof FileList) return value[0] || null
  return value || null
}

// يترجم أسماء حقول التحقق يلي بيرجعها Laravel (snake_case) لأسماء حقول
// الفورم بالفرونت (camelCase) — نفس اتجاه buildRegisterFormData بس
// بالعكس، عشان الصفحة تقدر تربط كل خطأ بحقله الصحيح مباشرة عبر
// react-hook-form's setError(fieldName, ...) بدون ما تعرف تفاصيل
// تسمية الباك اند
const LARAVEL_FIELD_TO_FORM_FIELD = {
  email: 'email',
  password: 'password',
  phone_number: 'phone',
  first_name: 'firstName',
  last_name: 'lastName',
  organization_name: 'orgName',
  contact_person: 'contactPerson',
  verification_document: 'verificationImage',
  password_confirmation: 'confirmPassword',
}

// أي حقل ما إله مقابل معروف (نادر) بيضل بإسمه الأصلي بدل ما يُفقد بصمت
function translateFieldErrors(rawFieldErrors) {
  if (!rawFieldErrors) return null

  const translated = {}
  Object.entries(rawFieldErrors).forEach(([laravelField, message]) => {
    const formField = LARAVEL_FIELD_TO_FORM_FIELD[laravelField] || laravelField
    translated[formField] = message
  })

  return translated
}

// تحديد نوع الحساب من استجابة الباك اند الحقيقي (roles) أو من بيانات الـ Mock (accountType)
//
// ⚠️ لا نرجّع "volunteer" كافتراضي صامت لما ما نلاقي role واضح. كانت
// النتيجة سابقًا إنه أي حساب منظمة وصلت بياناته roles فاضية أو غير متوقعة
// (خلل مؤقت بالباك اند مثلاً) بيتعامل معه كل الفرونت اند كمتطوع: رابط
// Dashboard يختفي من الناف بار، وزر "My Profile" بيوديه لصفحة بروفايل
// غلط. نرجّع null بدل هيك، وAuthContext.login() أصلاً برفض أي جلسة بدون
// accountType صالح (بيمسح التخزين ويرجّع false) — يعني الحساب ما بينسجّل
// دخول أصلًا بدل ما ينسجّل بدور خاطئ.
function resolveAccountType(data) {
  const roles = data?.roles
  if (Array.isArray(roles)) {
    // ⚠️ لازم نفحص admin *قبل* organization/volunteer — بدون هالأولوية،
    // حساب أدمن ما كان بينعرف عليه إطلاقًا (الدالة كانت ترجّع null
    // دايمًا لأي أدمن)، وAuthContext.login() برفض أي جلسة بدون
    // accountType صالح — يعني ما في أدمن قادر يسجّل دخول أساسًا
    if (roles.includes(ACCOUNT_TYPES.ADMIN)) return ACCOUNT_TYPES.ADMIN
    if (roles.includes(ACCOUNT_TYPES.ORGANIZATION)) return ACCOUNT_TYPES.ORGANIZATION
    if (roles.includes(ACCOUNT_TYPES.VOLUNTEER)) return ACCOUNT_TYPES.VOLUNTEER
  }

  if (data?.accountType === ACCOUNT_TYPES.ADMIN) return ACCOUNT_TYPES.ADMIN
  if (data?.accountType === ACCOUNT_TYPES.ORGANIZATION) return ACCOUNT_TYPES.ORGANIZATION
  if (data?.accountType === ACCOUNT_TYPES.VOLUNTEER) return ACCOUNT_TYPES.VOLUNTEER

  return null
}

// بناء بيانات المصادقة (user/token/accountType) من استجابة الـ API أو الـ Mock
// ملاحظة: apiClient يفكّ تغليف Laravel تلقائيًا (راجع unwrapLaravelEnvelope
// في api/client.js)، فـ responseData هون هو { user, token } مباشرة، بدون
// أي حاجة لقراءة response.data.data يدويًا هنا
function buildAuthPayload(responseData, fallbackEmail = '') {
  const apiUser = responseData?.user
  const apiToken = responseData?.token

  // يدعم كلا الحالتين: استجابة الـ API الحقيقي (apiUser) أو كائن الـ Mock المسطّح
  // normalizeUser هي نقطة التطبيع الوحيدة: تُنتج displayName و avatarUrl جاهزين
  const user = normalizeUser(sanitizeUser(apiUser || responseData))
  const accountType = resolveAccountType(apiUser || responseData)

  const tokenFromApi = typeof apiToken === 'string' ? apiToken : null
  const token = tokenFromApi || `mock-token-${fallbackEmail || 'user'}-${Date.now()}`

  return { user, token, accountType }
}

// تحويل بيانات نموذج التسجيل (camelCase) إلى FormData بأسماء حقول Laravel (snake_case)
// نستخدم FormData دائمًا لأن حساب المنظمة يتطلب رفع ملف verification_document
function buildRegisterFormData(payload) {
  const formData = new FormData()

  formData.append('account_type', payload.accountType)
  formData.append('email', payload.email.trim().toLowerCase())
  formData.append('password', payload.password)
  formData.append('password_confirmation', payload.password)

  // الهاتف مطلوب دائمًا هون (تم التحقق منه مسبقًا بـ validation.js)، فما في
  // داعي لشرط "if" وكأنه ممكن يكون فاضي — التناقض القديم بين الفورم (يمنع
  // الإرسال بدون هاتف) والكود هون (كان يتعامل معه كاختياري) صار محلول
  formData.append('phone_number', payload.phone)

  if (payload.accountType === ACCOUNT_TYPES.VOLUNTEER) {
    formData.append('first_name', payload.firstName)
    formData.append('last_name', payload.lastName)
  } else {
    formData.append('organization_name', payload.orgName)
    formData.append('contact_person', payload.contactPerson)

    const verificationFile = extractFile(payload.verificationImage)
    if (verificationFile) formData.append('verification_document', verificationFile)
  }

  return formData
}

export async function registerUser(payload) {
  await wait()

  if (MOCK_MODE) {
    const mockUsers = loadMockUsers()
    const normalizedEmail = payload.email.trim().toLowerCase()
    const existingUser = mockUsers.find((user) => user.email === normalizedEmail)

    if (existingUser) return { success: false, error: 'Email is already registered' }

    const accountType = payload.accountType || ACCOUNT_TYPES.VOLUNTEER

    const normalizedUser = {
      ...payload,
      accountType,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      // بدون backend، ما في حدا يولّد organizationId — لازم نعمله محليًا
      // هون وإلا organizationId بيضل غير موجود للأبد بوضع Mock، وبالتالي
      // useOrganizationProfileQuery (enabled: Boolean(organizationId))
      // ما بينفّذ أبدًا وصفحة بروفايل المنظمة/زر الـ Dashboard ما بيشتغلوا
      ...(accountType === ACCOUNT_TYPES.ORGANIZATION ? { organizationId: `org-${Date.now()}` } : {}),
    }

    mockUsers.push(normalizedUser)
    saveMockUsers(mockUsers)

    return { success: true, data: buildAuthPayload(normalizedUser, normalizedEmail) }
  }

  try {
    const formData = buildRegisterFormData(payload)
    const response = await apiClient.post('/register', formData)

    // نتحقق من شكل الاستجابة قبل ما نبني منها جلسة — لو الباك اند غيّر
    // شكل الرد بالغلط، منفشل بوضوح هون بدل جلسة "مكسورة" بصمت
    const validation = validateAuthResponse(response.data)
    if (!validation.success) return validation

    return {
      success: true,
      data: buildAuthPayload(validation.data, payload.email.trim().toLowerCase()),
    }
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to register account'),
      fieldErrors: translateFieldErrors(getApiFieldErrors(error)),
    }
  }
}

export async function loginUser(payload) {
  await wait()

  if (MOCK_MODE) {
    const mockUsers = loadMockUsers()
    const normalizedEmail = payload.email.trim().toLowerCase()
    const existingUser = mockUsers.find((user) => user.email === normalizedEmail)

    if (!existingUser || existingUser.password !== payload.password) {
      return { success: false, error: 'Invalid email or password' }
    }

    // ⚠️ ترقيع ذاتي لحسابات منظمة قديمة (اتسجّلت قبل ما صار registerUser
    // يولّد organizationId تلقائيًا): بدون organizationId، useOrganizationProfileQuery
    // (enabled: Boolean(organizationId)) ما بينفّذ إطلاقًا، وVerificationStatusBanner
    // بيضل ما يظهر أبدًا — مش لأنه الحالة مش موجودة، لأنه الطلب نفسه
    // ما بيصير. منولّدها هون مرة وحدة ونحفظها بصمت، فباقي الجلسة (وكل
    // جلسة جاية) تشتغل صح بدون ما تحتاج المستخدمة تمسح الحساب وتسجّل من جديد.
    // نفس المنطق لـ createdAt: حسابات اتسجّلت قبل ما صار registerUser
    // يخزّنه بيضلوا يطلعوا "Registered" فاضي بمودال تفاصيل المنظمة بالأدمن
    // للأبد بدون هالترقيع — تاريخ اليوم أقرب تقدير معقول بدون بيانات أصلية.
    let userForSession = existingUser
    const patch = {}
    if (existingUser.accountType === ACCOUNT_TYPES.ORGANIZATION && !existingUser.organizationId) {
      patch.organizationId = `org-${Date.now()}`
    }
    if (!existingUser.createdAt) {
      patch.createdAt = new Date().toISOString()
    }
    if (Object.keys(patch).length > 0) {
      userForSession = { ...existingUser, ...patch }
      const index = mockUsers.findIndex((user) => user.email === normalizedEmail)
      mockUsers[index] = userForSession
      saveMockUsers(mockUsers)
    }

    return {
      success: true,
      data: buildAuthPayload(userForSession, normalizedEmail),
    }
  }

  try {
    const response = await apiClient.post('/login', payload)

    // نفس التحقق يلي بالتسجيل — نقطة الدخول التانية الوحيدة لبيانات
    // الجلسة، فلازم تخضع لنفس الحماية
    const validation = validateAuthResponse(response.data)
    if (!validation.success) return validation

    return {
      success: true,
      data: buildAuthPayload(validation.data, payload.email.trim().toLowerCase()),
    }
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to sign in'),
      fieldErrors: translateFieldErrors(getApiFieldErrors(error)),
    }
  }
}

// تحديث بروفايل حساب الأدمن (اسم/إيميل/هاتف/نبذة قصيرة)
export async function updateAdminProfile(payload) {
  await wait()

  if (MOCK_MODE) {
    const email = getCurrentSessionEmail()
    if (!email) return { success: false, error: 'No active admin session found' }

    const updatedUser = updateMockUser(email, {
      name: payload.name?.trim() || '',
      email: payload.email?.trim().toLowerCase() || email,
      phone: payload.phone?.trim() || '',
      bio: payload.bio?.trim() || '',
    })

    if (!updatedUser) return { success: false, error: 'Admin account not found' }

    return { success: true, data: normalizeUser(sanitizeUser(updatedUser)) }
  }

  try {
    // TODO: تأكيد شكل/مسار الـ endpoint الحقيقي بالباك اند (Laravel) لما يجهز —
    // المسار هون تقديري بانتظار توثيق الـ API الرسمي لهذا المسار
    const response = await apiClient.put('/admin/profile', payload)
    return { success: true, data: normalizeUser(sanitizeUser(response.data)) }
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to update the admin profile'),
      fieldErrors: translateFieldErrors(getApiFieldErrors(error)),
    }
  }
}

// تغيير كلمة مرور حساب الأدمن — يتحقق من كلمة المرور الحالية بوضع الـ
// Mock قبل الاستبدال (نفس السلوك المتوقّع من أي endpoint حقيقي)
export async function changeAdminPassword(payload) {
  await wait()

  if (MOCK_MODE) {
    const email = getCurrentSessionEmail()
    if (!email) return { success: false, error: 'No active admin session found' }

    const mockUsers = loadMockUsers()
    const existingUser = mockUsers.find((user) => user.email === email)

    if (!existingUser || existingUser.password !== payload.currentPassword) {
      return { success: false, error: 'Current password is incorrect' }
    }

    updateMockUser(email, { password: payload.newPassword })
    return { success: true, data: {} }
  }

  try {
    // TODO: تأكيد شكل/مسار الـ endpoint الحقيقي بالباك اند (Laravel) لما يجهز —
    // المسار هون تقديري بانتظار توثيق الـ API الرسمي لهذا المسار
    await apiClient.put('/admin/password', payload)
    return { success: true, data: {} }
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to update the password'),
      fieldErrors: translateFieldErrors(getApiFieldErrors(error)),
    }
  }
}

// طلب رابط إعادة تعيين كلمة المرور — ترجع نجاحًا دائمًا بغض النظر عن
// وجود الإيميل من عدمه (منع Enumeration)، تمامًا كسلوك Laravel الحقيقي.
// لا فرق بالتوقيت ولا بشكل الاستجابة بين الحالتين — الفرع الوحيد الذي
// يتغيّر هو توليد الـ token فعليًا (أثر جانبي داخلي، غير مرئي للمستدعي)
export async function requestPasswordReset({ email }) {
  await wait()

  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (MOCK_MODE) {
    const mockUsers = loadMockUsers()
    const existingUser = mockUsers.find((user) => user.email === normalizedEmail)

    if (existingUser) {
      const token = generateResetToken(normalizedEmail)
      // ما في إرسال بريد فعلي بوضع Mock — نطبع الرابط الكامل بالـ console
      // فقط هون (أبدًا بفرع real) عشان يمكن اختبار التدفّق كامل يدويًا
      const resetLink = `${window.location.origin}${ROUTES.RESET_PASSWORD}?token=${token}&email=${encodeURIComponent(normalizedEmail)}`
      console.info('[Mock] Password reset link:', resetLink)
    }

    return { success: true, data: {} }
  }

  try {
    // TODO: تأكيد شكل/مسار الـ endpoint الحقيقي بالباك اند (Laravel) لما يجهز —
    // المسار هون تقديري (اصطلاح Fortify/Breeze)، ومتوقَّع أنه يرجّع 200
    // دائمًا بغض النظر عن وجود الإيميل (نفس سلوك فرع Mock أعلاه) — لو
    // خالف الباك اند الحقيقي هذا الافتراض لازم تطبيع الاستجابة هون بحيث
    // تبقى النتيجة عامة دائمًا مهما كان
    await apiClient.post('/forgot-password', { email: normalizedEmail })
    return { success: true, data: {} }
  } catch (error) {
    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to send reset link'),
      fieldErrors: translateFieldErrors(getApiFieldErrors(error)),
    }
  }
}

// إعادة تعيين كلمة المرور عبر token مُستلَم من رابط البريد الإلكتروني
export async function resetPassword({ token, email, password, passwordConfirmation }) {
  await wait()

  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (MOCK_MODE) {
    const isValidToken = consumeResetToken({ email: normalizedEmail, token })
    const updatedUser = isValidToken ? updateMockUser(normalizedEmail, { password }) : null

    if (!updatedUser) {
      return {
        success: false,
        error: 'This password reset link is invalid or has expired.',
        isTokenError: true,
      }
    }

    return { success: true, data: {} }
  }

  try {
    // TODO: تأكيد شكل/مسار الـ endpoint الحقيقي بالباك اند (Laravel) لما يجهز —
    // المسار هون تقديري (اصطلاح Fortify/Breeze)
    await apiClient.post('/reset-password', {
      token,
      email: normalizedEmail,
      password,
      password_confirmation: passwordConfirmation,
    })
    return { success: true, data: {} }
  } catch (error) {
    const rawFieldErrors = getApiFieldErrors(error) || {}
    // ⚠️ ما في حقل فورم مرئي اسمه "token" (المستخدم ما بيدخله يدويًا) —
    // لو رجّع الباك اند خطأ عليه، نستخدمه فقط لاشتقاق isTokenError بدل
    // تمريره لـ setError('token', ...) على حقل غير موجود أصلًا بالفورم
    const { token: tokenFieldError, ...restFieldErrors } = rawFieldErrors

    return {
      success: false,
      error: getApiErrorMessage(error, 'Unable to reset password'),
      fieldErrors: translateFieldErrors(restFieldErrors),
      isTokenError: Boolean(tokenFieldError),
    }
  }
}