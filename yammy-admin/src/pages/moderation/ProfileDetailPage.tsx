import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchModerationProfile, moderateProfile } from '@/entities/admin-auth/api'
import { fetchCurrentStaff } from '@/entities/admin-auth/api'
import { Button, Card } from '@/shared/ui/primitives'
import { UserProfilePreview } from '@/widgets/UserProfilePreview'
import { t } from '@/shared/lib/labels'

export function ProfileDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['moderation-profile', userId],
    queryFn: () => fetchModerationProfile(userId),
    enabled: Boolean(userId),
  })

  if (isLoading || !data || !staff) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
        {t.back}
      </button>
      <UserProfilePreview user={data} />
      <Card className="flex gap-3">
        <Button
          onClick={() =>
            void moderateProfile(userId, true).then(() => {
              refetch()
              navigate('/moderation/profiles')
            })
          }
        >
          {t.approve}
        </Button>
        <Button
          variant="ghost"
          onClick={() => void moderateProfile(userId, false).then(() => refetch())}
        >
          {t.reject}
        </Button>
      </Card>
    </div>
  )
}
