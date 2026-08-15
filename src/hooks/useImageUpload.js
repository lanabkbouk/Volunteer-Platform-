// يفصل منطق (اختيار صورة + التحقق منها + المعاينة المحلية) عن أي Component،
// بحيث ProfileHeader و OrgProfile وأي صفحة لاحقة (صورة الفرصة) تستخدم نفس
// الـ hook بدل تكرار FileReader ومنطق التحقق بكل صفحة.

import { useState, useCallback } from 'react'
import { validateImageFile } from '../services/api/mediaUpload'

/**
 * @param {string} [initialPreviewUrl] - رابط الصورة الحالية (مثلاً القادمة من الباك اند)
 */
export function useImageUpload(initialPreviewUrl = '') {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl)
  const [error, setError] = useState('')
  // ⚠️ مختلف عن "ما اخترتِ صورة جديدة" (file=null بشكل افتراضي، يعني
  // "خلّي الصورة الحالية زي ما هي"). removed=true تحديدًا يعني "بدي
  // أشيل الصورة الحالية الموجودة فعليًا" — تمييز لازم يوصل للباك اند
  // بشكل صريح (راجع services/volunteer.js)، وإلا "ما رسلنا ملف جديد"
  // هيتفسر افتراضيًا كـ"ما تغيّر شي"
  const [removed, setRemoved] = useState(false)

  // يُستدعى مباشرة من onChange لحقل <input type="file" />
  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const { valid, error: validationError } = validateImageFile(selectedFile)
    if (!valid) {
      setError(validationError)
      return
    }

    setError('')
    setFile(selectedFile)
    setRemoved(false)

    // معاينة محلية فورية قبل أي رفع فعلي للسيرفر
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(selectedFile)
  }, [])

  // إزالة صريحة للصورة الحالية (زر الـ X بـ ImageUploader) — بعكس عدم
  // اختيار صورة أصلًا، هون قرار واعٍ من المستخدم لمسح الصورة الموجودة
  const handleRemove = useCallback(() => {
    setFile(null)
    setPreviewUrl('')
    setError('')
    setRemoved(true)
  }, [])

  // يرجّع الحالة لوضعها الأصلي (بعد إلغاء التعديل، أو بعد نجاح الحفظ
  // لإعادة "تصفير" ما يُعتبر تغييرًا غير محفوظ بعدها)
  const reset = useCallback((resetPreviewUrl = '') => {
    setFile(null)
    setPreviewUrl(resetPreviewUrl)
    setError('')
    setRemoved(false)
  }, [])

  return { file, previewUrl, error, removed, handleFileChange, handleRemove, reset, setPreviewUrl }
}