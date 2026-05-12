import { useMutation, useQueryClient } from '@tanstack/react-query'

import { updateUserProfile } from '../api/userService'
import { usersQueryKeys } from '../lib/usersQueryKeys'
import type { UserUpdateRequestDto } from '../types/types'

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UserUpdateRequestDto) => updateUserProfile(body),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: usersQueryKeys.profile() })
    },
  })
}
