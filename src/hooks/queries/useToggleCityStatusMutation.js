import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleGovernorateStatus } from '../../services/syrianGovernorates'
import { queryKeys } from '../../app/queryKeys'

/**
 * يبدّل حالة تفعيل/تعطيل مدينة (أدمن فقط) — بدل الحذف الفعلي القديم.
 * راجع toggleGovernorateStatus بـ services/syrianGovernorates.js لسبب
 * استخدام تعطيل بدل حذف (سجلات قديمة مرجعية عبر nameEn).
 */
export function useToggleCityStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cityId, isActive }) => toggleGovernorateStatus(cityId, isActive),
    onSuccess: (result) => {
      if (!result?.success) return
      queryClient.setQueryData(queryKeys.cities.all, (current) =>
        Array.isArray(current)
          ? current.map((city) => (city.id === result.data.id ? result.data : city))
          : current,
      )
    },
  })
}
