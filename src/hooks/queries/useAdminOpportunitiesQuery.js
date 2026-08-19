import { useQuery } from '@tanstack/react-query'
import { fetchAdminOpportunities } from '../../services/admin'
import { queryKeys } from '../../app/queryKeys'

export function useAdminOpportunitiesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.opportunities,
    queryFn: fetchAdminOpportunities,
  })
}
