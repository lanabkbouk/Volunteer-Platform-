import { useQuery } from '@tanstack/react-query'
import { fetchAdminVolunteers } from '../../services/admin'
import { queryKeys } from '../../app/queryKeys'

export function useAdminVolunteersQuery() {
  return useQuery({
    queryKey: queryKeys.admin.volunteers,
    queryFn: fetchAdminVolunteers,
  })
}
