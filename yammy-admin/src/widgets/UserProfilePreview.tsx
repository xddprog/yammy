import { Card, Badge } from '@/shared/ui/primitives'
import type { AdminUserDetail, AdminUserPreview } from '@/shared/api/types'
import { labelSubscriptionTier, t } from '@/shared/lib/labels'

export function UserProfilePreview({ user }: { user: AdminUserDetail | AdminUserPreview }) {
  const stats = 'stats' in user ? user.stats : null
  const avatarUrl =
    user.main_photo ??
    ('photos' in user ? user.photos.find((photo) => photo.is_main)?.file_path : null) ??
    ('photos' in user ? user.photos[0]?.file_path : null)

  return (
    <Card>
      <div className="flex gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-24 rounded-xl object-cover" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">?</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{user.name}, {user.age}</h1>
            {user.is_banned && <Badge tone="danger">{t.banned}</Badge>}
            {user.profile_moderation_status === 'rejected' && (
              <Badge tone="danger">{t.moderationRejected}</Badge>
            )}
            {user.profile_moderation_status === 'pending' && (
              <Badge tone="neutral">{t.moderationPending}</Badge>
            )}
          </div>
          <p className="mt-1 text-zinc-400">{user.city}</p>
          {'bio' in user && user.bio && <p className="mt-3 text-sm text-zinc-300">{user.bio}</p>}
        </div>
      </div>
      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            [t.statLikesIn, stats.received_likes_count],
            [t.statMatchesShort, stats.matches_count],
            [t.statViews, stats.profile_views_count],
            [t.statReportsShort, stats.reports_received_count],
            [t.statLikesOut, stats.sent_likes_count],
            [t.statMessagesShort, stats.messages_sent_count],
            [t.statAiJobs, stats.ai_search_jobs_count],
            [t.statTier, labelSubscriptionTier(user.subscription_tier)],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg bg-zinc-950 px-3 py-2">
              <div className="text-xs uppercase text-zinc-500">{label}</div>
              <div className="text-lg font-semibold">{value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
