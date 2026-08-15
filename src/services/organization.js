// جلب وتحديث بروفايل المنظمة الحالية.
//
// GET /api/organizations/{id}   → بروفايل منظمة واحدة (فيها status)
// PUT /api/organizations/{id}   → تحديث بيانات نصية فقط (JSON عادي)
//
// بوضع mock، الشعار هلق بينحفظ فعليًا (Data URL بـ localStorage، نفس
// نمط services/volunteer.js) حتى تجربة الاختبار المحلي تعكس الميزة
// الكاملة بانتظار دعم الباك اند بالتحديث.

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { ORGANIZATION_STATUS } from '../constants/organizationStatus'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { loadMockUsers, updateMockUser } from './mock/mockUserStore'
import { validateOrganizationProfileResponse } from '../utils/api/apiResponseSchemas'
import { readFileAsDataUrl } from './api/fileToDataUrl'

const MOCK_MODE = isMockMode()

// إيميل المستخدم المسجّل دخوله حاليًا (من نفس الجلسة يلي AuthContext خزّنها)
// نستخدمه فقط بوضع الـ Mock للبحث داخل mockUsers
function getCurrentSessionEmail() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user?.email || null
  } catch {
    return null
  }
}

const EMPTY_ORGANIZATION = {
  id: null,
  name: '',
  email: '',
  contactPerson: '',
  description: '',
  city: '',
  website: '',
  // ⚠️ imageUrl (مو profileImageUrl): كان فيه عدم تطابق بين الاسم هون
  // واسم الحقل يلي orgProfile.jsx فعليًا بيقرأه (organization.imageUrl) —
  // نفس الاسم بالضبط يلي صار تصحيحه بـ organizationProfileResponseSchema
  // (apiResponseSchemas.js) لوضع real، حتى الوضعين يطابقوا نفس الـ Component
  imageUrl: null,
  verificationDocumentUrl: null,
  status: ORGANIZATION_STATUS.PENDING,
  owner: null,
}

/**
 * @param {number|string} organizationId - يجب أن يصل من AuthContext (user.organization.id)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchOrganizationProfile(organizationId) {
  if (MOCK_MODE) {
    await wait()

    const email = getCurrentSessionEmail()
    const mockUser = email ? loadMockUsers().find((u) => u.email === email) : null

    if (!mockUser) return { success: true, data: EMPTY_ORGANIZATION }

    return {
      success: true,
      data: {
        id: mockUser.organizationId || null,
        name: mockUser.orgName || '',
        // ⚠️ كان ناقص هون قبل — الإيميل كان موجود بس جوا owner.email،
        // بينما orgProfile.jsx وOrgProfilePreview بيقرأوا organization.email
        // مباشرة (نفس الشكل يلي organizationProfileResponseSchema بيرجعه
        // بوضع real)، فكان يظهر فاضي دايمًا بوضع mock رغم إنه محفوظ فعليًا
        email: mockUser.email || '',
        contactPerson: mockUser.contactPerson || '',
        description: mockUser.description || '',
        city: mockUser.city || '',
        website: mockUser.website || '',
        imageUrl: mockUser.imageUrl || null,
        verificationDocumentUrl: mockUser.verificationDocumentUrl || null,
        status: mockUser.status || ORGANIZATION_STATUS.PENDING,
        owner: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
      },
    }
  }

  if (!organizationId) {
    return { success: false, error: 'Organization id is required to load the profile' }
  }

  try {
    const response = await apiClient.get(`/organizations/${organizationId}`)

    // نتحقق من شكل الاستجابة (OrganizationResource الحقيقي) قبل ما توصل
    // لأي Component — لو حقل ناقص أو النوع غلط، هون التحقق بيرجّع خطأ واضح
    const validation = validateOrganizationProfileResponse(response.data)
    if (!validation.success) return validation

    return { success: true, data: validation.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to load organization profile') }
  }
}

/**
 * تحديث بروفايل المنظمة (بيانات نصية + شعار اختياري).
 * الحقول النصية تطابق OrganizationRequest بالضبط: name, description, city,
 * website, contact_person. لا يوجد "email" ضمن جدول organizations.
 *
 * ⚠️ الشعار (photoFile/removePhoto): بوضع Mock بينحفظ فعليًا (راجع تعليق
 * الملف بالأعلى، الملاحظة 2، وservices/api/fileToDataUrl.js لسبب استخدام
 * Data URL بدل Blob URL). بوضع real ما بينرسل إطلاقًا حاليًا — الباك اند
 * لسا ما بيعالج رفع ملف بهالـ endpoint (نفس الملاحظة). لو photoFile
 * وصل بوضع real، منتجاهله بصمت (مش خطأ) حتى ما تنكسر تجربة المستخدم
 * لحد ما يُضاف الدعم فعليًا بالباك اند.
 *
 * نفس شكل الاستدعاء بالضبط المستخدم بـ updateVolunteerProfile
 * (services/volunteer.js) — {values, photoFile, removePhoto} — عمدًا،
 * حتى orgProfile.jsx وvolunteerProfile.jsx يستخدموا نفس النمط تمامًا.
 *
 * @param {number|string} organizationId
 * @param {{ values: {name: string, description: string, city: string, website?: string, contactPerson: string}, photoFile?: File, removePhoto?: boolean }} payload
 */
export async function updateOrganizationProfile(organizationId, { values, photoFile, removePhoto } = {}) {
  if (MOCK_MODE) {
    await wait()

    // ⚠️ Data URL هون، مش URL.createObjectURL — نفس سبب services/volunteer.js
    // بالضبط: بيتخزّن بـ localStorage وازم يضل صالح بعد أي reload
    const imageUrl = photoFile ? await readFileAsDataUrl(photoFile) : undefined
    const email = getCurrentSessionEmail()

    if (email) {
      updateMockUser(email, {
        orgName: values?.name || '',
        description: values?.description || '',
        city: values?.city || '',
        website: values?.website || '',
        contactPerson: values?.contactPerson || '',
        ...(imageUrl ? { imageUrl } : removePhoto ? { imageUrl: '' } : {}),
      })
    }

    return { success: true, data: { imageUrl: imageUrl ?? (removePhoto ? '' : undefined) } }
  }

  if (!organizationId) {
    return { success: false, error: 'Organization id is required to update the profile' }
  }

  try {
    // ⚠️ multipart/form-data (مو JSON) هلق — نفس نمط services/volunteer.js
    // بالضبط (POST + _method: PUT، لأن PHP ما بيقرأ ملفات بـ PUT مباشر).
    // الباك اند حاليًا (OrganizationController::update) لسا ما بيعالج
    // hasFile('photo') إطلاقًا (بعكس VolunteerController::update يلي
    // جاهز) — لسا مطلوب Backend action لإضافتها هناك (راجع
    // docs/Backend-Requirements-Addendum.pdf). لحد ما تُضاف، الباك اند
    // ببساطة بيتجاهل حقل الملف ويحدّث بس الحقول النصية — آمن 100%،
    // بس الشعار مش رح ينحفظ فعليًا لحد ما يُضاف الدعم هناك
    const formData = new FormData()
    formData.append('name', values?.name || '')
    formData.append('description', values?.description || '')
    formData.append('city', values?.city || '')
    formData.append('website', values?.website || '')
    formData.append('contact_person', values?.contactPerson || '')
    if (photoFile) {
      formData.append('photo', photoFile)
    } else if (removePhoto) {
      // ⚠️ كانت ناقصة تمامًا هون (موجودة بـ services/volunteer.js بس) —
      // بدون إشارة صريحة، الباك اند ما إله طريقة يفرّق "ما لمسنا الشعار"
      // عن "بدنا نمسحه". Backend action: حقل remove_photo="1" لسا مش
      // موثّق ولا مُتحقَّق منه — نفس ملاحظة services/volunteer.js تمامًا
      // (راجع docs/Backend-Requirements-Addendum.pdf لإضافته لاحقًا)
      formData.append('remove_photo', '1')
    }
    formData.append('_method', 'PUT')

    const response = await apiClient.post(`/organizations/${organizationId}`, formData, {
      headers: { 'Content-Type': undefined }, // يخلي المتصفح يحدد الـ boundary تلقائيًا
    })

    // ⚠️ الباك اند بيرجّع الحقل باسم profile_image (راجع
    // OrganizationResource.php)، مش imageUrl — نطبّعه هون بنقطة وحدة
    // بدل ما orgProfile.jsx يعرف شكل استجابة الباك اند الخام
    return { success: true, data: { ...response.data, imageUrl: response.data?.profile_image ?? undefined } }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to save organization profile') }
  }
}

// ————————————————————————————————————————————————————————————
// إعادة رفع وثيقة التوثيق بعد الرفض (Resubmit Verification Document)
//
// ⚠️ عكس الوثيقة الأصلية (read-only بعد إنشاء الحساب — راجع الملاحظة
// بأعلى الملف)، هاي الدالة **بترسل ملف جديد فعليًا** ليحل محل الوثيقة
// المرفوضة، وبترجّع الحالة لـ pending تلقائيًا حتى يراجعها الأدمن من
// جديد. هاي نقطة الحل الوحيدة المتاحة للمنظمة لما يكون سبب الرفض
// متعلق بالوثيقة نفسها (كانت request-review القديمة بترجّع pending
// بنفس الوثيقة المرفوضة، بدون أي فرصة تصليح فعلي).
//
// الباك اند الحقيقي ما عنده هالـ endpoint لسا — مطلوب جديد:
//   POST /organizations/{id}/verification-document  (multipart/form-data)
// (حقل واحد: verification_document، يرجّع status=pending ويصفّر rejection_reason)
// ————————————————————————————————————————————————————————————

/**
 * @param {number|string} organizationId
 * @param {{file: File, previewUrl: string}} document - previewUrl هي معاينة
 *   base64 محلية جاهزة أصلًا من useImageUpload، نستخدمها بوضع mock فقط
 *   كبديل لرابط تخزين حقيقي (ما في سيرفر فعلي يرفع له الملف بهالوضع)
 * @returns {Promise<{success: boolean, error?: string, data?: object}>}
 */
export async function resubmitVerificationDocument(organizationId, { file, previewUrl }) {
  if (!file) return { success: false, error: 'Please select a document to upload' }

  if (MOCK_MODE) {
    await wait()

    const email = getCurrentSessionEmail()
    if (!email) return { success: false, error: 'Could not identify the current organization' }

    const updated = updateMockUser(email, {
      verificationDocumentUrl: previewUrl,
      status: ORGANIZATION_STATUS.PENDING,
      rejectionReason: '',
    })

    return { success: true, data: { verificationDocumentUrl: updated?.verificationDocumentUrl } }
  }

  if (!organizationId) {
    return { success: false, error: 'Organization id is required to resubmit the document' }
  }

  try {
    const formData = new FormData()
    formData.append('verification_document', file)

    const response = await apiClient.post(`/organizations/${organizationId}/verification-document`, formData)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to upload the new document') }
  }
}