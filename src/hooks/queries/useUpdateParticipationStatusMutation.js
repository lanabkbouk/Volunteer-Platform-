import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateParticipationStatus } from '../../services/participations'
import { queryKeys } from '../../app/queryKeys'

/**
 * يقبل/يرفض طلب متقدّم على فرصة معيّنة. بعد النجاح، نحدّث حالته مباشرة
 * بكاش قائمة المتقدّمين (بدون إعادة جلب كاملة)، ونبطّل صفحة "My
 * Volunteering" الخاصة فيه لو كانت مفتوحة بمكان تاني.
 * @param {string} opportunityId
 */
export function useUpdateParticipationStatusMutation(opportunityId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicantId, status, reason }) => updateParticipationStatus(applicantId, status, reason),
    onSuccess: (result, { applicantId, status }) => {
      if (!result?.success) return

      queryClient.setQueryData(
        queryKeys.participations.applicants(opportunityId),
        (current) =>
          Array.isArray(current)
            ? current.map((applicant) =>
                applicant.id === applicantId ? { ...applicant, status } : applicant,
              )
            : current,
      )

      queryClient.invalidateQueries({ queryKey: queryKeys.participations.mine })
      // ⚠️ لازم كمان نبطّل كاش الفرص: currentVolunteers محسوبة لحظيًا من
      // حالة المشاركات (راجع computeLiveCurrentVolunteers بـ services/opportunities.js)،
      // فبدون هالسطر العداد بالكارد/التفاصيل بيضل يعرض القيمة القديمة
      // المخزّنة بالكاش لحد ما يصير refetch يدوي أو reload، رغم إن
      // القبول/الرفض نفسه نجح فعليًا بالبيانات
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all })
    },
  })
}