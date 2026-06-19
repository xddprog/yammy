import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchModerationProfiles } from '@/entities/admin-auth/api'
import { Badge, Card } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { t } from '@/shared/lib/labels'

export function ProfilesModerationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['moderation-profiles'],
    queryFn: () => fetchModerationProfiles(),
  })

  if (isLoading) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t.profileModeration}</h1>
      {!data?.items.length ? (
        <Card><p className="text-zinc-400">{t.queueEmpty}</p></Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((user) => (
            <Link key={user.id} to={`/moderation/profiles/${user.id}`}>
              <Card className="flex items-center gap-4 transition hover:border-zinc-600">
                {user.main_photo ? (
                  <img src={user.main_photo} alt="" className="size-14 rounded-lg object-cover" />
                ) : (
                  <div className="size-14 rounded-lg bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{user.name}, {user.age}</div>
                  <div className="text-sm text-zinc-400">{user.city}</div>
                </div>
                <Badge tone="neutral">{t.pending}</Badge>
                <div className="text-xs text-zinc-500">{formatDate(user.created_at)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
