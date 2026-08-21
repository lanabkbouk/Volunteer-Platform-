import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resubmitVerificationDocument } from '../../services/organization'
import { queryKeys } from '../../app/queryKeys'
import { ORGANIZATION_STATUS } from '../../constants/organizationStatus'

/**
 * ترفع المنظمة وثيقة توثيق جديدة بعد الرفض، ليحل محل الملف المرفوض.
 * بعد النجاح، نحدّث كاش بروفايل المنظمة مباشرة (status → pending،
 * verificationDocumentUrl → الجديد، rejectionReason → فاضي) بدل إعادة
 * جلب كاملة، حتى الـ Banner وباقي الصفحات المشتركة تنعكس فورًا.
 */
export function useResubmitVerificationDocumentMutation(organizationId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (document) => resubmitVerificationDocument(organizationId, document),
    onSuccess: (result) => {
      if (!result?.success) return

      // الشكل هون مسطّح مباشرة (بدون {success,data}) — نفس شكل
      // fetchOrganizationProfile الحقيقي هلق بعد ما صار يرمي (throw)
      // بدل ما يرجّع {success,...}
      queryClient.setQueryData(queryKeys.organization.profile(organizationId), (current) =>
        current
          ? {
              ...current,
              status: ORGANIZATION_STATUS.PENDING,
              rejectionReason: '',
              verificationDocumentUrl: result.data?.verificationDocumentUrl ?? current.verificationDocumentUrl,
            }
          : current,
      )
    },
  })
}
