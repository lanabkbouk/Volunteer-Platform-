import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchOrganizations } from '../../services/organizations'
import { queryKeys } from '../../app/queryKeys'

/**
 * يجلب قائمة المنظمات صفحة-صفحة (فلترة الاسم/المدينة تصير داخل الـ
 * service نفسه). useInfiniteQuery بدل useQuery العادي، لأن الباك اند
 * الحقيقي يُرجع النتيجة مُصفّحة (paginate(15)) — راجع services/organizations.js
 * لتفاصيل شكل {data, meta, links} المتوقَّع من fetchOrganizations.
 *
 * TODO: فلترة "الموثّقة فقط" معطّلة مؤقتًا لحد ما الباك اند يضيف عمود
 * status لجدول organizations — راجع التعليق بـ services/organizations.js
 * @param {{search?: string}} filters
 */
export function useOrganizationsQuery({ search = '' } = {}) {
  return useInfiniteQuery({
    // ⚠️ لا نضيف page للمفتاح عمدًا: useInfiniteQuery بيدير كل الصفحات
    // المجلوبة تحت نفس المفتاح الواحد (pages: [...]) بنفسه. أي تغيّر
    // بـ search هون بيولّد مفتاحًا جديدًا بالكامل، فـ React Query بيبلّش
    // من initialPageParam (صفحة 1) تلقائيًا مع كل بحث جديد — بدون أي
    // منطق يدوي إضافي لإعادة الضبط
    queryKey: queryKeys.organizations.list({ search }),
    queryFn: ({ pageParam }) => fetchOrganizations({ search, page: pageParam }),
    initialPageParam: 1,
    // نعتمد أولًا على meta.current_page/last_page (الشكل المؤكَّد لـ
    // Laravel paginate())، ونرجع لـ links.next كبديل فقط لو meta غير
    // متوفرة لأي سبب — دفاع مزدوج بدل الاعتماد على حقل واحد بس
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta
      if (meta && typeof meta.current_page === 'number' && typeof meta.last_page === 'number') {
        return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined
      }

      return lastPage?.links?.next ? Number(lastPage.links.next) : undefined
    },
    // يبقي نتائج البحث السابقة ظاهرة أثناء كتابة حرف جديد، بدل فلاش
    // شاشة تحميل فاضية مع كل ضغطة (نفس نمط useOpportunitiesQuery)
    placeholderData: (previousData) => previousData,
  })
}
