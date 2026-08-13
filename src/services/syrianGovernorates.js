// src/services/syrianGovernorates.js

/**
 * قائمة المحافظات السورية (بيانات ثابتة - Mock Data)
 * ----------------------------------------------------
 * بيانات تجريبية ثابتة لحين ربط المشروع بالـ Laravel API فعليًا.
 * البنية مصممة لتطابق الشكل المتوقع من الباك اند مستقبلًا (id, nameAr, nameEn, slug)
 * بحيث عند استبدال هذا الملف باستدعاء API حقيقي (fetch/axios لهذا الملف نفسه)
 * لا تحتاج أي Component لتغيير طريقة التعامل مع البيانات.
 *
 * id     : المعرف الفعلي الذي يُرسل/يُستقبل من الباك اند (Foreign Key لاحقًا)
 * nameAr : اسم المحافظة بالعربية (لعرضها في الواجهة)
 * nameEn : اسم المحافظة بالإنجليزية (يُستخدم حاليًا كقيمة حقل "city")
 * slug   : معرف نصي مختصر (مفيد للروابط أو الفلترة في الـ URL)
 */
export const syrianGovernorates = [
  { id: 1,  nameEn: "Damascus", nameAr: "دمشق", slug: "damascus" },
  { id: 2,  nameEn: "Rural Damascus", nameAr: "ريف دمشق", slug: "rural-damascus" },
  { id: 3,  nameEn: "Aleppo", nameAr: "حلب", slug: "aleppo" },
  { id: 4,  nameEn: "Homs", nameAr: "حمص", slug: "homs" },
  { id: 5,  nameEn: "Hama", nameAr: "حماة", slug: "hama" },
  { id: 6,  nameEn: "Latakia", nameAr: "اللاذقية", slug: "latakia" },
  { id: 7,  nameEn: "Tartus", nameAr: "طرطوس", slug: "tartus" },
  { id: 8,  nameEn: "Idlib", nameAr: "إدلب", slug: "idlib" },
  { id: 9,  nameEn: "Daraa", nameAr: "درعا", slug: "daraa" },
  { id: 10, nameEn: "As-Suwayda", nameAr: "السويداء", slug: "as-suwayda" },
  { id: 11, nameEn: "Quneitra", nameAr: "القنيطرة", slug: "quneitra" },
  { id: 12, nameEn: "Deir ez-Zor", nameAr: "دير الزور", slug: "deir-ez-zor" },
  { id: 13, nameEn: "Raqqa", nameAr: "الرقة", slug: "raqqa" },
  { id: 14, nameEn: "Al-Hasakah", nameAr: "الحسكة", slug: "al-hasakah" },
];

/**
 * Alias بأحرف كبيرة للتوافق مع الـ Components التي تستورد بهذا الاسم
 * (مثل ProfileForm.jsx و ProfileHeader.jsx). نفس المرجع، بدون تكرار البيانات.
 */
export const SYRIAN_GOVERNORATES = syrianGovernorates;

/** عدد المحافظات السورية */
export const SYRIAN_GOVERNORATES_COUNT = syrianGovernorates.length;

/**
 * دالة مساعدة لجلب محافظة عبر الـ id
 * @param {number} id
 * @returns {object|undefined}
 */
export const getGovernorateById = (id) =>
  syrianGovernorates.find((governorate) => governorate.id === id);

/**
 * دالة مساعدة لجلب محافظة عبر الاسم الإنجليزي (nameEn)
 * مفيدة عند التعامل مع حقل "city" الذي يخزّن نصًا إنجليزيًا وليس id
 * @param {string} nameEn
 * @returns {object|undefined}
 */
export const getGovernorateByNameEn = (nameEn) =>
  syrianGovernorates.find((governorate) => governorate.nameEn === nameEn);

/**
 * تحويل القائمة إلى شكل عناصر Dropdown/Select
 * (value = id, label = الاسم بالعربية)
 */
export const getGovernorateOptions = () =>
  syrianGovernorates.map(({ id, nameAr }) => ({
    value: id,
    label: nameAr,
  }));

export default syrianGovernorates;

// ————————————————————————————————————————————————————————————
// إدارة المدن/المحافظات (أدمن فقط) — نفس نمط {success,data/error}
// المستخدم بـ categories.js وskills.js بالضبط. بوضع Mock، بنعدّل
// نفس مصفوفة syrianGovernorates بالمكان (push/splice) حتى القائمة
// تضل مصدر الحقيقة الوحيد لأي مكان تاني بيستوردها.
//
// ⚠️ ملاحظة معمارية: الفورمات (Register، بروفايل المنظمة، إنشاء فرصة)
// بتبني قائمة الخيارات (GOVERNORATE_ITEMS) مرة وحدة وقت تحميل الملف،
// فتعديل/حذف/إضافة مدينة من هون ما بينعكس فيها إلا بعد إعادة تحميل
// الصفحة — سلوك مقبول لحد ما يتوفر API حقيقي وتصير الفورمات تجيب
// القائمة عبر useQuery متل باقي البيانات، بدل استيراد ثابت وقت البناء.
//
// TODO: لما يجهز الباك اند، استبدلي الفرع غير-mock هون بنداءات حقيقية:
// POST /api/governorates, PUT /api/governorates/{id}, DELETE /api/governorates/{id}
// ————————————————————————————————————————————————————————————

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'

const MOCK_MODE = isMockMode()

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * ينشئ محافظة/مدينة جديدة.
 * @param {{nameAr: string, nameEn: string}} payload
 */
export async function createGovernorate(payload) {
  if (MOCK_MODE) {
    await wait()

    const nameTaken = syrianGovernorates.some(
      (governorate) => governorate.nameEn.trim().toLowerCase() === payload.nameEn.trim().toLowerCase(),
    )
    if (nameTaken) return { success: false, error: 'A city with this name already exists' }

    const newGovernorate = {
      id: Date.now(),
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      slug: slugify(payload.nameEn),
    }
    syrianGovernorates.push(newGovernorate)
    return { success: true, data: newGovernorate }
  }

  try {
    const response = await apiClient.post('/governorates', payload)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to create city') }
  }
}

/**
 * يعدّل اسم محافظة/مدينة موجودة.
 * @param {number|string} governorateId
 * @param {{nameAr: string, nameEn: string}} payload
 */
export async function updateGovernorate(governorateId, payload) {
  if (MOCK_MODE) {
    await wait()

    const governorate = syrianGovernorates.find((item) => item.id === governorateId)
    if (!governorate) return { success: false, error: 'City not found' }

    const nameTaken = syrianGovernorates.some(
      (item) =>
        item.id !== governorateId && item.nameEn.trim().toLowerCase() === payload.nameEn.trim().toLowerCase(),
    )
    if (nameTaken) return { success: false, error: 'A city with this name already exists' }

    governorate.nameAr = payload.nameAr
    governorate.nameEn = payload.nameEn
    governorate.slug = slugify(payload.nameEn)
    return { success: true, data: governorate }
  }

  try {
    const response = await apiClient.put(`/governorates/${governorateId}`, payload)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update city') }
  }
}

/**
 * يحذف محافظة/مدينة.
 * @param {number|string} governorateId
 */
export async function deleteGovernorate(governorateId) {
  if (MOCK_MODE) {
    await wait()

    const index = syrianGovernorates.findIndex((item) => item.id === governorateId)
    if (index === -1) return { success: false, error: 'City not found' }

    syrianGovernorates.splice(index, 1)
    return { success: true }
  }

  try {
    await apiClient.delete(`/governorates/${governorateId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to delete city') }
  }
}