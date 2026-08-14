// services/organizations.js
//
// دليل المنظمات العام (Organizations Directory) — منفصل عمدًا عن
// services/organization.js (المفرد)، يلي مسؤول عن بروفايل *منظمتي أنا*
// (fetchOrganizationProfile / updateOrganizationProfile، محمي بمصادقة).
// هذا الملف بالمقابل مسؤول عن القائمة العامة والتفاصيل العامة لأي منظمة
// يتصفحها زائر/متطوع — نفس فرق opportunities.js عن services/opportunity.js
// لو كان موجود بالمشروع.
//
// ✅ تأكيد من فحص فعلي لكود الباك اند (OrganizationController + Resource):
// GET /api/organizations       -> قائمة، لكن مُصفّحة (paginate(15))، والرد
//                                  الفعلي جوا data.data مش data مباشرة.
//                                  ⚠️ الباك حاليًا لا يقرأ ?search= إطلاقًا
//                                  (index() بدون أي منطق فلترة) — الاستعلام
//                                  منرسله بأي حال تحسّبًا لما يُضاف مستقبلًا،
//                                  بس لا تتفاجئي لو ما فلتر فعليًا لسا.
// GET /api/organizations/{id}  -> منظمة واحدة، غير مُصفّحة.
//
// ⚠️ فروقات تسمية حقيقية بين الباك والفرونت (مؤكّدة من OrganizationResource):
//   contact_person  → contactPerson   (snake_case بالباك)
//   profile_image   → profileImageUrl (مسار كامل جاهز فعلاً، مش مجرد اسم ملف)
//   owner.email     → لا يوجد بروفايل منظمة "بريد" منفصل، بس owner متوفر لو احتجناه لاحقًا
//
// 🔴 فجوتان لا يمكن حلّهما من الفرونت (تحتاج الباك اند):
//   1) phone: موجود فعليًا بجدول users (عمود phone_number)، بس
//      OrganizationResource ما بيرجعه إطلاقًا. لحد ما يُضاف، بيرجع undefined دايمًا.
//   2) status: عمود "status" مش موجود إطلاقًا بجدول organizations —
//      بيرجع null دايمًا بغض النظر عن حالة التوثيق الفعلية.
//
// ⚠️ فلترة "الموثّقة فقط" (راجع isVerifiedOrStatusUnavailable تحت):
// الدليل العام لازم يعرض المنظمات الموثّقة (verified) فقط، لكن حقل
// status نفسه غير مضمون الوصول من الباك اند حاليًا (دايمًا null، راجع
// الملاحظة فوق). الفلترة مصمَّمة عشان تشتغل بأمان بالحالتين: لو الحقل
// وصل فعليًا بقيمة حقيقية، نفلتر عليه؛ ولو ما وصل (undefined أو null)،
// نعرض القائمة كاملة بدون فلترة بدل ما نكسر الصفحة أو نعرضها فاضية
// بالغلط. فور ما الباك اند يضيف العمود ويرجّع قيمة حقيقية، الفلترة
// بتصير فعّالة تلقائيًا بدون أي تعديل إضافي هون.

import { apiClient, getApiErrorMessage } from './api/client'
import { isMockMode } from './api/mockMode'
import { wait } from './api/delay'
import { ORGANIZATION_STATUS } from '../constants/organizationStatus'
import { ACCOUNT_TYPES } from '../constants/auth/accountTypes'
import { loadMockUsers } from './mock/mockUserStore'

const MOCK_MODE = isMockMode()

// نفس المنظمات المرجعية المستخدمة أصلاً داخل MOCK_OPPORTUNITIES
// (org1..org4) حتى تبقى الفرص المعروضة بصفحة تفاصيل كل منظمة متسقة
// مع بيانات الفرص الفعلية. org5 إضافية هون فقط (status=PENDING، بدون
// أي فرصة مرتبطة بها — منظمة غير موثّقة أصلًا ما بتقدر تنشر فرص) لإثبات
// إن فلترة "الموثّقة فقط" بوضع mock فعلًا تستبعدها من الدليل العام.
const MOCK_ORGANIZATIONS = [
  // ⚠️ 'org-mock' هو نفسه MOCK_MY_ORGANIZATION_ID المستخدم بـ
  // mockOpportunitiesStore.js لأغلب الفرص (o1/o2/o3/o4/o6) — تمثيل
  // "منظمتي أنا" بلوحة تحكم المنظمة (راجع فلترة fetchMyOpportunities
  // بـ services/opportunities.js). بدون هالسجل هون، الضغط على اسم
  // المنظمة بكارد أي فرصة من هذول كان يوجّه لـ /organizations/org-mock
  // فيرجع fetchOrganizationById null (.find() ما بيلاقي تطابق) وتظهر
  // "This organization could not be found." — نفس اسم 'My Organization'
  // المستخدم مسبقًا لنفس المعرّف بـ opportunities.js (إنشاء فرصة جديدة)
  {
    id: 'org-mock',
    name: 'My Organization',
    description: 'Your organization profile, used for testing opportunities you publish in mock mode.',
    city: 'Rotterdam, Netherlands',
    phone: '+31600000000',
    website: '',
    contactPerson: '',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.VERIFIED,
  },
  {
    id: 'org1',
    name: 'Blue Drop Foundation',
    description: 'Providing clean water access and hygiene education to underserved communities.',
    city: 'Rotterdam, Netherlands',
    phone: '+31611111111',
    website: 'https://bluedrop.example.org',
    contactPerson: 'Amina Youssef',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.VERIFIED,
  },
  {
    id: 'org2',
    name: 'Bright Minds NGO',
    description: 'After-school tutoring and literacy programs for local students.',
    city: 'The Hague, Netherlands',
    phone: '+31622222222',
    website: 'https://brightminds.example.org',
    contactPerson: 'Karim Haddad',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.VERIFIED,
  },
  {
    id: 'org3',
    name: 'Green Coast Initiative',
    description: 'Coastal and marine ecosystem cleanup and conservation projects.',
    city: 'Scheveningen, Netherlands',
    phone: '+31633333333',
    website: 'https://greencoast.example.org',
    contactPerson: 'Lina Farouk',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.VERIFIED,
  },
  {
    id: 'org4',
    name: 'City Food Bank',
    description: 'Fighting food insecurity through community food drives and distribution.',
    city: 'Amsterdam, Netherlands',
    phone: '+31644444444',
    website: 'https://cityfoodbank.example.org',
    contactPerson: 'Omar Al-Sayed',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.VERIFIED,
  },
  {
    id: 'org5',
    name: 'New Hope Collective',
    description: 'Recently registered — still awaiting verification by the platform admins.',
    city: 'Utrecht, Netherlands',
    phone: '+31655555555',
    website: 'https://newhope.example.org',
    contactPerson: 'Rana Idris',
    profileImageUrl: null,
    status: ORGANIZATION_STATUS.PENDING,
  },
]

/**
 * فلترة دفاعية لـ"الموثّقة فقط" على بيانات الباك اند الخام (قبل أي
 * تطبيع عبر mapOrganizationFromApi، لأن تلك الدالة بترجّع status
 * افتراضي PENDING لو الحقل غايب أصلًا — فلو فلترنا بعد التطبيع كنا رح
 * نخسر القدرة على التفريق بين "غير موثّقة فعليًا" و"الحقل غير متوفر").
 *
 * - status غير موجود إطلاقًا (undefined) أو null (سلوك الباك اند
 *   الحقيقي حاليًا — راجع الملاحظة أعلى الملف): نعتبره "غير متاح بعد"
 *   ونُبقي المنظمة، بدون أي فلترة، تمامًا كالسلوك الحالي قبل هالتعديل.
 * - status وصل فعليًا بقيمة حقيقية: نُبقي المنظمة فقط لو كانت verified.
 * @param {{status?: string|null}} raw
 */
function isVerifiedOrStatusUnavailable(raw) {
  const status = raw?.status
  if (typeof status === 'undefined' || status === null) return true
  return status === ORGANIZATION_STATUS.VERIFIED
}

/**
 * يحوّل حساب منظمة مسجَّل فعليًا (mockUsers) لنفس شكل عناصر
 * MOCK_ORGANIZATIONS بالضبط — نفس أسماء الحقول يلي services/organization.js
 * (المفرد، بروفايل "منظمتي") بيقرأها/يكتبها من نفس سجل mockUsers، حتى
 * القيم تبقى متطابقة بين الدليل العام وبروفايل المنظمة نفسها.
 * @param {object} mockUser
 */
function mapMockUserToOrganization(mockUser) {
  return {
    id: mockUser.organizationId,
    name: mockUser.orgName || '',
    description: mockUser.description || '',
    city: mockUser.city || '',
    phone: mockUser.phone || '',
    website: mockUser.website || '',
    contactPerson: mockUser.contactPerson || '',
    profileImageUrl: mockUser.imageUrl || null,
    status: mockUser.status || ORGANIZATION_STATUS.PENDING,
  }
}

/**
 * MOCK_ORGANIZATIONS الثابتة + أي منظمة اتسجّلت فعليًا عبر صفحة
 * Register (مخزّنة بـ mockUsers، راجع services/auth.js registerUser).
 * بدون هذا الدمج، منظمة جديدة كانت تختفي تمامًا من الدليل العام
 * وصفحة تفاصيلها (/organizations/:id) رغم إنها فعليًا مسجَّلة وعندها
 * organizationId صالح — راجع services/organization.js يلي بيقرأ نفس
 * سجل mockUsers هذا لبروفايل "منظمتي".
 */
function getAllMockOrganizations() {
  const registeredOrganizations = loadMockUsers()
    .filter((user) => user.accountType === ACCOUNT_TYPES.ORGANIZATION && user.organizationId)
    .map(mapMockUserToOrganization)

  return [...MOCK_ORGANIZATIONS, ...registeredOrganizations]
}

/**
 * يحوّل استجابة OrganizationResource الخام (snake_case، owner متداخل)
 * لنفس شكل بيانات الـ mock تمامًا — نقطة واحدة، بدل ما كل Component
 * يعرف تفاصيل تسمية الباك اند.
 */
function mapOrganizationFromApi(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name || '',
    description: raw.description || '',
    city: raw.city || '',
    // 🔴 غير متوفر من الباك حاليًا (راجعي الملاحظة بأعلى الملف)
    phone: raw.phone || '',
    website: raw.website || '',
    contactPerson: raw.contact_person || '',
    profileImageUrl: raw.profile_image || null,
    // 🔴 دايمًا null حاليًا لحد ما الباك يضيف عمود status (راجعي الملاحظة بأعلى الملف)
    status: raw.status || ORGANIZATION_STATUS.PENDING,
  }
}

/**
 * يجلب قائمة المنظمات **الموثّقة فقط** (فلترة الاسم/المدينة تصير هون
 * بوضع الـ mock، وبتنتقل لـ query param ?search= بوضع real). فلترة
 * "الموثّقة فقط" مفعّلة بالوضعين — راجع isVerifiedOrStatusUnavailable
 * أعلى الملف لتفاصيل السلوك الدفاعي بوضع real لما status ما يكون متاحًا.
 * @param {{search?: string}} filters
 * @returns {Promise<Array<object>>}
 */
export async function fetchOrganizations({ search = '' } = {}) {
  if (MOCK_MODE) {
    await wait()

    // بوضع mock الحقل status موجود ومضمون دايمًا (بيانات محلية ثابتة أو
    // مُدارة عبر admin.js reviewOrganization)، فالفلترة هون مباشرة وأكيدة
    // 100% — بعكس وضع real تحت يلي بيحتاج فحص دفاعي لأن الباك اند لسا ما
    // بيرجّع status حقيقي (راجع الملاحظة أعلى الملف)
    const verifiedOrganizations = getAllMockOrganizations().filter(
      (organization) => organization.status === ORGANIZATION_STATUS.VERIFIED,
    )

    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return verifiedOrganizations

    return verifiedOrganizations.filter(
      (organization) =>
        organization.name.toLowerCase().includes(normalizedSearch) ||
        organization.city.toLowerCase().includes(normalizedSearch),
    )
  }

  try {
    // نرسل ?status=verified تحسّبًا لدعم الباك اند لها مستقبلًا (حتى لو
    // متجاهلها حاليًا بما إنه index() بدون أي منطق فلترة فعليًا — راجع
    // الملاحظة أعلى الملف) — فور ما يُضاف الدعم فعليًا بالخادم، الفلترة
    // بتشتغل من هناك مباشرة بدون أي تعديل هون
    const response = await apiClient.get('/organizations', {
      params: { search, status: ORGANIZATION_STATUS.VERIFIED },
    })
    // الباك اند بيرجّع النتيجة مُصفّحة (paginate) — بعد فك تغليف Laravel
    // بـ client.js، response.data بيصير { data: [...], links, meta }
    // مش array مباشرة، فلازم ندخل مستوى إضافي هون تحديدًا
    const list = Array.isArray(response.data) ? response.data : response.data?.data || []

    // طبقة أمان إضافية محليًا (Defensive) على الخام قبل التطبيع — لو
    // الباك اند تجاهل ?status= فوق (أو لسا ما بيدعمها إطلاقًا)، نصفّي
    // هون بدل ما نعرض منظمات غير موثّقة بالغلط. لو حقل status نفسه غير
    // متوفر إطلاقًا بالاستجابة، ما بنطبّق أي فلترة ونعرض القائمة كاملة
    // (سلوك الوضع الحالي بالضبط) بدل ما نكسر الصفحة أو نعرضها فاضية
    return list.filter(isVerifiedOrStatusUnavailable).map(mapOrganizationFromApi)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load organizations'), { cause: error })
  }
}

/**
 * يجلب منظمة واحدة بتفاصيلها الكاملة (لصفحة العرض العامة، ليس بروفايل "منظمتي").
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchOrganizationById(id) {
  if (MOCK_MODE) {
    await wait()
    return getAllMockOrganizations().find((organization) => organization.id === id) || null
  }

  try {
    const response = await apiClient.get(`/organizations/${id}`)
    return mapOrganizationFromApi(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to load this organization'), { cause: error })
  }
}