import { useMutation, useQueryClient } from '@tanstack/react-query'

import { activateBoost } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'

export function useActivateBoost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => activateBoost(),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: usersQueryKeys.profile() })
    },
  })
}
