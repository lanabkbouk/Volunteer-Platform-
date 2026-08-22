import axios from 'axios'
import { AUTH_STORAGE_KEY, SESSION_EXPIRED_STORAGE_KEY } from '../../constants/auth/storage'
import { ROUTES } from '../../constants/paths'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// بدون هاد، طلب معلَّق (سيرفر لا يرد، لا خطأ صريح) كان ينتظر بلا أي حدّ
// زمني فعلي — بيضل "جاري التحميل" للأبد بدل ما يفشل بوقت معقول ويعرض
// رسالة واضحة للمستخدم
const REQUEST_TIMEOUT_MS = 15000

// لا نضبط Content-Type بشكل ثابت هنا: axios يحدده تلقائيًا
// (application/json للكائنات العادية، أو multipart/form-data مع الـ boundary الصحيح عند إرسال FormData)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
})

apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return config

    const { token } = JSON.parse(raw)
    if (typeof token === 'string' && token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // ignore invalid session payload
  }

  return config
})

// Laravel API Resources تلف كل استجابة (عنصر واحد أو قائمة) بمفتاح "data"،
// وأحيانًا تضيف "meta"/"links" مع الـ Pagination. كنا نفكّ هالتغليف يدويًا
// وبأشكال مختلفة داخل كل ملف خدمة على حدة:
//   Array.isArray(response.data) ? response.data : response.data?.data || []
// نفكّه هون مرة وحدة بس، فيصير كود كل خدمة يتعامل مع response.data مباشرة
// وكأنه البيانات النهائية فعلاً، بغض النظر إذا كانت قائمة أو كائن واحد.
function unwrapLaravelEnvelope(response) {
  const body = response.data

  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    response.meta = body.meta
    response.links = body.links
    response.data = body.data
  }

  return response
}

// عند انتهاء صلاحية التوكن أو رفضه (401)، الجلسة القديمة صارت عديمة الفائدة:
// نمسحها فورًا ونرجّع المستخدم لصفحة تسجيل الدخول، بدل ما يضل "مسجل دخول"
// شكليًا وهو فعليًا مرفوض من كل استدعاء API لاحق.
apiClient.interceptors.response.use(
  (response) => unwrapLaravelEnvelope(response),
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)

      // تجنّب حلقة تحويل لا نهائية لو الـ 401 صار أصلًا من صفحة تسجيل الدخول نفسها
      if (window.location.pathname !== ROUTES.LOGIN) {
        // window.location.assign تحويل صلب (إعادة تحميل كاملة)، فأي state
        // تمرَّر عبر React Router (زي state.from المستخدم بـ ProtectedRoute)
        // بتضيع. sessionStorage هو الوحيد اللي بينجو من إعادة التحميل —
        // Login.jsx بيقرأه ويعرض سبب التحويل، بدل ما المستخدم يظهر فجأة
        // بصفحة الدخول بلا أي تفسير (وبيضيع أي فورم كان يعبّيه)
        try {
          sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, '1')
        } catch {
          // تجاهل (مثلًا وضع تصفح خاص يمنع sessionStorage) — التحويل نفسه أهم من الرسالة
        }

        window.location.assign(ROUTES.LOGIN)
      }
    }

    return Promise.reject(error)
  },
)

// انقطاع شبكة كامل (offline/DNS/CORS) أو انتهاء المهلة (timeout) ما بيوصل
// أصلًا لسيرفر Laravel، فـ error.response غير موجود إطلاقًا — لازم رسالة
// مختلفة عن أخطاء الاستجابة العادية (422/500...)، وإلا axios بيرجّع نص
// عام مثل "Network Error" يبان وكأنه خطأ سيرفر حقيقي
export function getApiErrorMessage(error, fallbackMessage = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'The request took too long to respond. Please check your connection and try again.'
    }

    if (!error.response) {
      return 'Unable to reach the server. Please check your internet connection and try again.'
    }

    return error.response?.data?.message || error.response?.data?.error || error.message || fallbackMessage
  }

  if (error instanceof Error) return error.message

  return fallbackMessage
}

// يستخرج أخطاء التحقق لكل حقل من استجابة Laravel 422 (شكلها المعتاد:
// { message, errors: { field: ["msg1", "msg2"] } }) — بترجع أول رسالة
// لكل حقل بس (كافي لعرضها تحت حقل الفورم المقابل مباشرة)، أو null لو
// مافي أخطاء حقول إطلاقًا (401 بيانات دخول خاطئة، 500، انقطاع شبكة...)
export function getApiFieldErrors(error) {
  if (!axios.isAxiosError(error)) return null

  const errors = error.response?.data?.errors
  if (!errors || typeof errors !== 'object') return null

  const fieldErrors = {}
  Object.entries(errors).forEach(([field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages[0]
    }
  })

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null
}