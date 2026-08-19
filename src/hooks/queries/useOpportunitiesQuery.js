import { useQuery } from '@tanstack/react-query'
import { fetchOpportunities, fetchSuggestedOpportunities } from '../../services/opportunities'
import { queryKeys } from '../../app/queryKeys'

/**
 * هوك موحّد لجلب الفرص، بيقرر لحاله أي endpoint يستخدم حسب isSuggestedTab:
 * - التبويب المقترح: fetchSuggestedOpportunities (حسب مهارات/مدينة المتطوع)
 * - غير هيك: fetchOpportunities (حسب البحث والتصنيفات والمهارات المختارة)
 *
 * كل حالة إلها queryKey مختلف، فـ React Query بيفصل الـ cache تلقائيًا
 * بينهم (تبديل التبويب ما بيلخبط نتائج التصفح العادي، والعكس صحيح).
 *
 * ⚠️ categoryIds/skillIds مصفوفات (فلترة متعددة) — matchesFilters
 * بـ services/opportunities.js تدعمها أصلًا، هون فقط نمرّرها بدل
 * الاكتفاء بـ categoryId مفرد كما كان سابقًا
 *
 * @param {{isSuggestedTab: boolean, search?: string, categoryIds?: string[], skillIds?: string[], user?: object}} params
 */
export function useOpportunitiesQuery({
  isSuggestedTab,
  search = '',
  categoryIds = [],
  skillIds = [],
  user,
} = {}) {
  const suggestedParams = {
    skillIds: Array.isArray(user?.skillIds) ? user.skillIds : [],
    city: user?.city || '',
  }

  return useQuery({
    queryKey: isSuggestedTab
      ? queryKeys.opportunities.suggested(suggestedParams)
      : queryKeys.opportunities.list({ search, categoryIds, skillIds }),
    queryFn: () =>
      isSuggestedTab
        ? fetchSuggestedOpportunities(suggestedParams)
        : fetchOpportunities({ search, categoryIds, skillIds }),
    // يخلي نتائج البحث/الفلتر السابقة ظاهرة أثناء تحميل الفلتر الجديد
    // (بدل فلاش شاشة تحميل فاضية مع كل ضغطة مفتاح أو تبديل تصنيف)
    placeholderData: (previousData) => previousData,
  })
}
