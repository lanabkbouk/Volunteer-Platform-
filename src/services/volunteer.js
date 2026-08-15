// Handles saving the currently logged-in volunteer's own profile
// (personal info, skills, photo). Keeps the API call out of the page
// component, consistent with every other service in this project.
//
// POST /api/volunteers/me  (multipart/form-data, because of the photo)
// Laravel requires POST + _method: PUT for file uploads in updates.

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { updateMockUser } from './mock/mockUserStore'

const MOCK_MODE = isMockMode()

// إيميل الجلسة الحالية — نفس النمط المستخدم بـ services/organization.js
function getCurrentSessionEmail() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.user?.email || null
  } catch {
    return null
  }
}

// يبني FormData بأسماء وقيَم حقول Laravel الصحيحة انطلاقًا من بيانات الفورم الخام (camelCase)
// هذا هو المكان الوحيد الذي يعرف شكل الباك اند، بدل تكرار هذا التحويل داخل صفحة الـ Profile
function buildVolunteerFormData({ values, photoFile }) {
  const formData = new FormData()

  formData.append('education_level', values.educationLevel || '')
  formData.append('birth_date', values.dateOfBirth || '')
  // الباك اند يتحقق من هذا الحقل بحروف صغيرة فقط: in:male,female
  formData.append('gendre', (values.gender || '').toLowerCase())
  formData.append('city', values.city || '')
  formData.append('about', values.about || '')
  formData.append('interests', values.interests || '')
  // كانت ناقصة هون بالكامل — skills حقل إجباري (≥1) بالفورم، بس الطلب
  // الحقيقي ما كان يرسلها إطلاقًا، فأي تعديل مهارات كان يضيع صامتًا بوضع
  // real. نفس أسلوب تسلسل المصفوفات المستخدم أصلًا بـ buildOpportunityFormData
  // (JSON.stringify)، حتى يبقى التعامل مع array بداخل FormData موحّد بالمشروع
  formData.append('skill_ids', JSON.stringify(values.skills || []))

  if (photoFile) formData.append('photo', photoFile)

  return formData
}

/**
 * يحفظ بروفايل المتطوع.
 * @param {number|string} volunteerId
 * @param {{ values: object, photoFile?: File }} payload - بيانات الفورم الخام + الصورة (اختياري)
 * @returns {Promise<{success: boolean, data?: {imageUrl?: string}, error?: string}>}
 */
export async function updateVolunteerProfile(volunteerId, { values, photoFile } = {}) {
  if (MOCK_MODE) {
    await wait()

    const imageUrl = photoFile ? URL.createObjectURL(photoFile) : undefined
    const email = getCurrentSessionEmail()

    // ⚠️ كانت هون بترجع success بدون ما تحفظ أي شي فعليًا بمخزن
    // mock_auth_users — التعديلات كانت تظهر ناجحة وتضل بالجلسة الحالية
    // بس (بفضل updateUser بـ AuthContext)، لكن تضيع فورًا بعد تسجيل
    // خروج/دخول لأنه loginUser بيرجع يقرأ نسخة قديمة من المخزن.
    if (email) {
      updateMockUser(email, {
        educationLevel: values?.educationLevel || '',
        dateOfBirth: values?.dateOfBirth || '',
        gender: values?.gender || '',
        city: values?.city || '',
        about: values?.about || '',
        skillIds: values?.skills || [],
        interests: values?.interests || '',
        // ما عاد في داعي لعلم profileCompleted هون: اكتمال البروفايل
        // بيتحدد الآن من فحص هالحقول نفسها مباشرة (utils/auth/profileCompletion.js)،
        // بنفس الطريقة بوضعي mock وreal معًا
        ...(imageUrl ? { imageUrl } : {}),
      })
    }

    return { success: true, data: { imageUrl } }
  }

  if (!volunteerId) {
    return { success: false, error: 'Volunteer id is required to update the profile' }
  }

  try {
    const formData = buildVolunteerFormData({ values, photoFile })

    // IMPORTANT:
    // PHP does NOT read files in PUT multipart/form-data.
    // So we send POST + _method: PUT to allow Laravel to process the file.
    formData.append('_method', 'PUT')

    const response = await apiClient.post(`/volunteers/${volunteerId}`, formData, {
      headers: { 'Content-Type': undefined }, // allow browser to set boundary
    })

    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to save profile') }
  }
}