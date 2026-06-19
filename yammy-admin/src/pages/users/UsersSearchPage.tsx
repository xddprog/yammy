import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { searchUsers } from '@/entities/admin-auth/api'
import { Badge, Card } from '@/shared/ui/primitives'
import { labelSubscriptionTier, t } from '@/shared/lib/labels'
import {
  UsersSearchFilters,
  buildUserSearchParams,
  emptyUserSearchFilters,
} from '@/widgets/UsersSearchFilters'

export function UsersSearchPage() {
  const [filters, setFilters] = useState(emptyUserSearchFilters)
  const searchParams = useMemo(() => buildUserSearchParams(filters), [filters])

  const { data, isLoading } = useQuery({
    queryKey: ['users-search', searchParams],
    queryFn: () => searchUsers(searchParams),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.users}</h1>
      <UsersSearchFilters value={filters} onChange={setFilters} />
      {isLoading ? (
        <div className="text-zinc-400">{t.loading}</div>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {t.searchResults}: {data?.total ?? 0}
          </p>
          <div className="space-y-2">
            {data?.items.map((user) => (
              <Link key={user.id} to={`/users/${user.id}`}>
                <Card className="flex items-center gap-4 transition hover:border-zinc-600">
                  {user.main_photo ? (
                    <img src={user.main_photo} alt="" className="size-12 rounded-lg object-cover" />
                  ) : (
                    <div className="size-12 rounded-lg bg-zinc-800" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-zinc-400">
                      {user.city} · {labelSubscriptionTier(user.subscription_tier)}
                    </div>
                  </div>
                  {user.is_banned && <Badge tone="danger">{t.banned}</Badge>}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
