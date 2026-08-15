import { createContext, useContext, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAccountType } from '../constants/auth/accountTypes'
import { AUTH_STORAGE_KEY } from '../constants/auth/storage'
import { normalizeUser } from '../utils/auth/normalizeUser'

const AuthContext = createContext(null)

const emptySession = {
  user: null,
  token: null,
  accountType: null,
  isAuthenticated: false,
}

function loadPersistedSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return emptySession

  try {
    const parsed = JSON.parse(raw)
    const accountType = isAccountType(parsed?.accountType) ? parsed.accountType : null
    const token = typeof parsed?.token === 'string' ? parsed.token : null
    const user = parsed?.user && typeof parsed.user === 'object' ? parsed.user : null

    if (!user || !token || !accountType) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return emptySession
    }

    return { user, token, accountType, isAuthenticated: true }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return emptySession
  }
}

function persistSession({ user, token, accountType }) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token, accountType }))
  } catch (error) {
    // ⚠️ لو فشلت (مثلًا QuotaExceededError — صورة base64 كبيرة + بيانات
    // Mock متراكمة من جلسات اختبار كتيرة)، ما منوقف تحديث الجلسة
    // بالذاكرة (state لسا بيتحدث طبيعي بالتابع اللي استدعى هاي الدالة)؛
    // بس التغيير ما رح يبقى بعد reload/جلسة جديدة. نسجّل تحذير واضح
    // بالـ console بدل فشل صامت 100% بدون أي أثر
    console.warn('Failed to persist session to localStorage — changes will not survive a reload.', error)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadPersistedSession)
  // نفس نسخة الـ QueryClient المزروعة بـ main.jsx (AuthProvider جوا
  // QueryClientProvider)، فـ clear() هون بيمسح فعليًا كل الكاش المشترك
  const queryClient = useQueryClient()

  const login = (payload = {}) => {
    const user = payload.user && typeof payload.user === 'object' ? payload.user : null
    const token = typeof payload.token === 'string' ? payload.token : null
    const accountType = isAccountType(payload.accountType) ? payload.accountType : null

    if (!user || !token || !accountType) {
      setSession(emptySession)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return false
    }

    // نصفّر الكاش قبل تفعيل الجلسة الجديدة: أي query بدون scope بالـ id
    // (زي opportunities.mine أو participations.mine) بيتحمّل من جديد
    // للمستخدم الجديد بدل ما يورّث بيانات آخر مستخدم كان مسجّل دخول
    queryClient.clear()

    const next = { user, token, accountType, isAuthenticated: true }
    setSession(next)
    persistSession(next)
    return true
  }

  const logout = () => {
    setSession(emptySession)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    // نفس السبب: منع أي شاشة تالية (حتى صفحة تسجيل دخول تانية بنفس التبويب)
    // من عرض بيانات مستخدم سجّل خروجه فعليًا
    queryClient.clear()
  }

  const updateUser = (nextUser) => {
    if (!nextUser || typeof nextUser !== 'object') return

    setSession((current) => {
      if (!current.isAuthenticated) return current

      const user = normalizeUser({ ...(current.user || {}), ...nextUser })
      const next = { ...current, user }
      persistSession(next)
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ ...session, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}