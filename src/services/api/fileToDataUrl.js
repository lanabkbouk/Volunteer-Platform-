// services/api/fileToDataUrl.js
//
// ⚠️ ليش مش URL.createObjectURL؟
// URL.createObjectURL(file) بيرجع رابط blob: مربوط بذاكرة التبويب
// الحالي فقط — بمجرد ما تنعمل reload للصفحة (أو تُقفل وتُفتح من جديد)،
// الرابط بينكسر نهائيًا حتى لو نفس الملف محفوظ بمكان تاني. أي مكان
// بنخزّن فيه الصورة بـ localStorage (زي mockUserStore هون، أو أي مكان
// تاني بوضع mock) لازم يستخدم Data URL (base64) بدل هيك — نص كامل
// self-contained، بيضل صالح للأبد بغض النظر عن reload أو جلسة جديدة.
//
// الفرق فقط بوضع mock (تخزين محلي دائم) — الرفع الحقيقي (FormData
// لـ apiClient) ما إله علاقة بهالملف إطلاقًا، بيرسل الـ File الخام
// زي ما هو للباك اند.

/**
 * @param {File} file
 * @returns {Promise<string>} data:image/...;base64,... — يبقى صالح بعد أي reload
 */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}