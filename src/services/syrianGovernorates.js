// src/services/syrianGovernorates.js

/**
 * قائمة المحافظات السورية (بيانات ثابتة - Mock Data)
 * ----------------------------------------------------
 * بيانات تجريبية ثابتة لحين ربط المشروع بالـ Laravel API فعليًا.
 * البنية مصممة لتطابق الشكل المتوقع من الباك اند مستقبلًا (id, nameAr, nameEn, slug)
 * بحيث عند استبدال هذا الملف باستدعاء API حقيقي (fetch/axios لهذا الملف نفسه)
 * لا تحتاج أي Component لتغيير طريقة التعامل مع البيانات.
 *
 * id       : المعرف الفعلي الذي يُرسل/يُستقبل من الباك اند (Foreign Key لاحقًا)
 * nameAr   : اسم المحافظة بالعربية (لعرضها في الواجهة)
 * nameEn   : اسم المحافظة بالإنجليزية (يُستخدم حاليًا كقيمة حقل "city")
 * slug     : معرف نصي مختصر (مفيد للروابط أو الفلترة في الـ URL)
 * isActive : تفعيل/تعطيل المدينة (افتراضيًا true) — راجع toggleGovernorateStatus
 *   بالأسفل لسبب استخدام تعطيل بدل حذف فعلي
 */
export const syrianGovernorates = [
  { id: 1,  nameEn: "Damascus", nameAr: "دمشق", slug: "damascus", isActive: true },
  { id: 2,  nameEn: "Rural Damascus", nameAr: "ريف دمشق", slug: "rural-damascus", isActive: true },
  { id: 3,  nameEn: "Aleppo", nameAr: "حلب", slug: "aleppo", isActive: true },
  { id: 4,  nameEn: "Homs", nameAr: "حمص", slug: "homs", isActive: true },
  { id: 5,  nameEn: "Hama", nameAr: "حماة", slug: "hama", isActive: true },
  { id: 6,  nameEn: "Latakia", nameAr: "اللاذقية", slug: "latakia", isActive: true },
  { id: 7,  nameEn: "Tartus", nameAr: "طرطوس", slug: "tartus", isActive: true },
  { id: 8,  nameEn: "Idlib", nameAr: "إدلب", slug: "idlib", isActive: true },
  { id: 9,  nameEn: "Daraa", nameAr: "درعا", slug: "daraa", isActive: true },
  { id: 10, nameEn: "As-Suwayda", nameAr: "السويداء", slug: "as-suwayda", isActive: true },
  { id: 11, nameEn: "Quneitra", nameAr: "القنيطرة", slug: "quneitra", isActive: true },
  { id: 12, nameEn: "Deir ez-Zor", nameAr: "دير الزور", slug: "deir-ez-zor", isActive: true },
  { id: 13, nameEn: "Raqqa", nameAr: "الرقة", slug: "raqqa", isActive: true },
  { id: 14, nameEn: "Al-Hasakah", nameAr: "الحسكة", slug: "al-hasakah", isActive: true },
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
 * المحافظات المفعّلة فقط (isActive !== false) — هاي القائمة يلي لازم تُستخدم
 * بأي قائمة اختيار مدينة بفورمات المستخدمين (تسجيل، بروفايل، إنشاء فرصة).
 * المدن المعطّلة تضل موجودة بالمصفوفة الكاملة (لأن سجلات قديمة عبر
 * nameEn لسا بترجع لها)، بس ما لازم تظهر كخيار جديد قابل للاختيار —
 * فقط بصفحة إدارة المدن نفسها (أدمن) يقدر الأدمن يشوفها ويعيد تفعيلها.
 */
export const getActiveGovernorates = () =>
  syrianGovernorates.filter((governorate) => governorate.isActive !== false);

// نفس تحويل "Rural Damascus" → "Rif Dimashq" المستخدم فعليًا بكل فورمات
// اختيار المحافظة (قيمة الحقل المُرسلة/المخزّنة تختلف عن nameEn لهاي
// المحافظة تحديدًا) — دالة واحدة هون تُستخدم بأي منطق داخل هالملف يحتاج
// يطابق قيمة مُختارة بمحافظتها الفعلية، بدل تكرار نفس الشرط أكثر من مرة
export const getGovernorateSelectValue = (nameEn) =>
  nameEn === 'Rural Damascus' ? 'Rif Dimashq' : nameEn

/**
 * يبحث عن محافظة عبر قيمتها المستخدمة فعليًا بحقول الاختيار (value)،
 * وليس nameEn الخام — مهم تحديدًا لمحافظة "Rural Damascus" يلي قيمتها
 * المُرسلة "Rif Dimashq" (راجع getGovernorateSelectValue فوق).
 * @param {string} value
 */
export const getGovernorateBySelectValue = (value) =>
  syrianGovernorates.find((governorate) => getGovernorateSelectValue(governorate.nameEn) === value)

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
// POST /api/governorates, PUT /api/governorates/{id}, PATCH /api/governorates/{id}/status
// ————————————————————————————————————————————————————————————

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { closeCityOpportunitiesRegistration } from './opportunities'

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
 * يبدّل حالة تفعيل/تعطيل محافظة (بدل حذفها فعليًا).
 *
 * ⚠️ ما منحذف أي سجل مدينة نهائيًا — لا هون بوضع mock، ولا مستقبلًا مع
 * الـ API الحقيقي (لا يوجد DELETE endpoint هون أصلًا). المدن مرجعية بسجلات
 * قديمة كثيرة عبر nameEn (حقل city بالفرص وبروفايلات المستخدمين)، فحذفها
 * فعليًا كان رح يترك تلك السجلات تشير لمدينة غير موجودة (بيانات يتيمة/
 * مكسورة). التعطيل فقط بيمنعها من الظهور كخيار جديد بقوائم الاختيار
 * (راجع getActiveGovernorates أعلاه)، مع إبقاء كل سجل قديم سليمًا تمامًا.
 * @param {number|string} governorateId
 * @param {boolean} isActive - الحالة الجديدة المطلوبة (يحسبها الطرف الطالب
 *   من الحالة الحالية، بنفس نمط setOpportunityStatus بـ services/opportunities.js)
 */
export async function toggleGovernorateStatus(governorateId, isActive) {
  if (MOCK_MODE) {
    await wait()

    const governorate = syrianGovernorates.find((item) => item.id === governorateId)
    if (!governorate) return { success: false, error: 'City not found' }

    governorate.isActive = isActive

    // إغلاق تسجيل تلقائي (مش إلغاء) — بس عند التعطيل، مش عند إعادة
    // التفعيل: المحافظة صارت خارج نطاق خدمة المنصة، فأي فرصة فيها لسا
    // مسجّلة تسجيل مفتوح فعليًا بتوقف عن قبول متطوعين جدد. التفاصيل
    // والاستثناءات (IN_PROGRESS/COMPLETED/مقفولة أصلًا لسبب تاني) بالكامل
    // جوا closeCityOpportunitiesRegistration (services/opportunities.js)
    if (isActive === false) {
      closeCityOpportunitiesRegistration(governorate.nameEn)
    }

    // ⚠️ إعادة التفعيل (isActive: true) عمدًا ما بتعيد فتح أي فرصة اتقفل
    // تسجيلها بسبب التعطيل تلقائيًا — قرار نهائي ومقصود (راجع تعليق
    // closeCityOpportunitiesRegistration لتفاصيل السبب)، مش Bug
    return { success: true, data: governorate }
  }

  try {
    const response = await apiClient.patch(`/governorates/${governorateId}/status`, { isActive })
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error, 'Failed to update city status') }
  }
}