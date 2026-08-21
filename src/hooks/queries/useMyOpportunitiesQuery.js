import { useQuery } from '@tanstack/react-query'
import { fetchMyOpportunities } from '../../services/opportunities'
import { isMockMode } from '../../services/api/mockMode'
import { queryKeys } from '../../app/queryKeys'

/**
 * يجلب الفرص المنشورة من طرف المنظمة الحالية (صفحة "My Causes").
 *
 * ⚠️ enabled: نفس ملاحظة useOrganizationProfileQuery بالضبط — بوضع mock
 * fetchMyOpportunities بيدوّر عن الفرص بالجلسة المخزّنة مش بالـ
 * organizationId الممرَّر، فتعطيل الاستعلام لحد ما يوصل organizationId
 * كان يمنع الطلب بصمت لأي حساب قديم أو حساب اتسجّل بلحظة كان فيها خلل
 * مؤقت بتوليد الـ ID، رغم إنه البيانات الفعلية جاهزة تنجلب أصلًا —
 * والاستعلام كان يضل isPending للأبد (Skeleton دائم بصفحة My Causes).
 * @param {string} organizationId - هوية المنظمة الحالية (من AuthContext)
 */
export function useMyOpportunitiesQuery(organizationId) {
  return useQuery({
    queryKey: queryKeys.opportunities.mine(organizationId),
    queryFn: () => fetchMyOpportunities(organizationId),
    enabled: isMockMode() || Boolean(organizationId),
  })
}