import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { recordProfileView } from '../api/userService'

export function useRecordProfileView(): UseMutationResult<void, Error, string> {
  return useMutation({
    mutationFn: (userId: string) => recordProfileView(userId),
  })
}
