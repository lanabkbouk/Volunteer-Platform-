import { useCallback, useMemo, useState } from 'react'

const DEFAULT_INITIAL_COUNT = 6

// ⚠️ مقارنة *محتوى* بدل مرجع (===) — تعبيرات شائعة جدًا متل
// `query.data ?? []` بترجع مصفوفة فاضية جديدة *بكل Render* أثناء
// التحميل (نفس المحتوى، مرجع مختلف كل مرة). لو قارنّا بالمرجع بس،
// بتضل State تتحدّث كل Render → "Too many re-renders" (بالضبط الخلل
// يلي صار بصفحة المنظمات). المقارنة هون رخيصة (عناصر القوائم هون
// كائنات ثابتة المرجع من كاش React Query، فمقارنة سطحية كافية ودقيقة)
function areItemsEqual(a, b) {
  if (a === b) return true
  if (a.length !== b.length) return false
  return a.every((item, index) => item === b[index])
}

/**
 * هوك عام لعرض أول N عنصر من أي قائمة، مع زر "Show more" يكشف الباقي
 * دفعة واحدة (مش صفحة صفحة — القائمة صغيرة أصلًا بكل الصفحات المستخدمة
 * فيها، فما في داعي لتعقيد Pagination حقيقي هون).
 *
 * ⚠️ لا يُستخدم بصفحة "All Opportunities" (تصفح كامل) — هناك القرار
 * إظهار كل النتائج دفعة واحدة لأنها الصفحة المخصصة للتصفح الكامل.
 *
 * @param {Array} items - القائمة الكاملة (بعد أي فلترة/بحث سابق)
 * @param {number} [initialCount] - عدد العناصر المعروضة قبل الضغط على "Show more"
 */
export function useShowMore(items, initialCount = DEFAULT_INITIAL_COUNT) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  // نتتبّع القائمة السابقة بحالة عادية (مو Effect) — نمط React الموصى
  // به لـ"تعديل حالة عند تغيّر Prop": تعديل الحالة أثناء الرندر نفسه
  // مباشرة أرخص من Effect وبدون أي Render إضافي متأخر
  const [prevItems, setPrevItems] = useState(items)

  // لو تغيّر *محتوى* القائمة فعليًا (بحث/فلتر جديد)، نرجّع العداد
  // لبدايته — وإلا ممكن يضل المستخدم "مفتوح" على عدد أكبر من نتائج
  // فلتر تاني أصغر، بدون أي فايدة فعلية
  if (!areItemsEqual(items, prevItems)) {
    setPrevItems(items)
    setVisibleCount(initialCount)
  }

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const hasMore = visibleCount < items.length
  const remainingCount = Math.max(items.length - visibleCount, 0)

  // useCallback (مرجع ثابت) لا مجرد دالة عادية — استهلاك شائع لهاد الهوك
  // هو تمرير showMore كـ dependency بـ useEffect بمكان تاني (مثلًا تمرير
  // + تمييز فرصة قادمة من صفحة تانية بـ myCauses.jsx)، ولو تغيّر مرجعها
  // كل render (بغض النظر عن أي شي فعلي تغيّر)، أي Effect زي هيك بيعيد
  // التنفيذ بدون داعي — وممكن يمسح Timers مجدولة بمنتصف الطريق بالغلط
  const showMore = useCallback(() => setVisibleCount((count) => count + initialCount), [initialCount])

  return { visibleItems, hasMore, remainingCount, showMore }
}