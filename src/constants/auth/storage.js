export const AUTH_STORAGE_KEY = 'auth_session'
export const MOCK_USERS_STORAGE_KEY = 'mock_auth_users'
export const MOCK_PASSWORD_RESETS_STORAGE_KEY = 'mock_password_resets'
export const MOCK_PARTICIPATIONS_STORAGE_KEY = 'mock_participations'
export const MOCK_VOLUNTEER_PROFILES_STORAGE_KEY = 'mock_volunteer_profiles'

// يُضبط لحظيًا قبل التحويل الصلب (window.location.assign) عند 401 بمنتصف
// الجلسة — sessionStorage (مو localStorage) لأنه إشعار لمرة وحدة خاص بهاد
// التبويب بالذات، لازم ينجو من إعادة تحميل الصفحة (راجع services/api/client.js
// وpages/auth/Login.jsx)
export const SESSION_EXPIRED_STORAGE_KEY = 'session_expired_notice'
