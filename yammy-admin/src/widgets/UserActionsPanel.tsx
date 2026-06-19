import { useState } from 'react'
import { Card, Button, Input } from '@/shared/ui/primitives'
import { banUser, setBalances, setModerationFlag, setSubscription } from '@/entities/admin-auth/api'
import type { AdminUserDetail } from '@/shared/api/types'
import { t } from '@/shared/lib/labels'

export function UserActionsPanel({ user, onChanged }: { user: AdminUserDetail; onChanged: () => void }) {
  const [tier, setTier] = useState(user.subscription_tier)
  const [expiresAt, setExpiresAt] = useState(user.subscription_expires_at?.slice(0, 16) ?? '')
  const [superlikes, setSuperlikes] = useState(String(user.superlikes_balance))
  const [boosts, setBoosts] = useState(String(user.boosts_balance))
  const [loading, setLoading] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setLoading(true)
    try {
      await action()
      onChanged()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-semibold">{t.actions}</h2>
      <Button
        variant={user.is_banned ? 'ghost' : 'danger'}
        disabled={loading}
        onClick={() => void run(() => banUser(user.id, !user.is_banned))}
      >
        {user.is_banned ? t.unban : t.ban}
      </Button>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">{t.subscription}</label>
        <select
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        >
          <option value="free">{t.tierFree}</option>
          <option value="vip">{t.tierVip}</option>
          <option value="premium">{t.tierPremium}</option>
        </select>
        <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        <Button
          disabled={loading}
          onClick={() =>
            void run(() => setSubscription(user.id, tier, expiresAt ? new Date(expiresAt).toISOString() : null))
          }
        >
          {t.saveSubscription}
        </Button>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">{t.balances}</label>
        <Input value={superlikes} onChange={(e) => setSuperlikes(e.target.value)} placeholder={t.superlikes} />
        <Input value={boosts} onChange={(e) => setBoosts(e.target.value)} placeholder={t.boosts} />
        <Button
          disabled={loading}
          onClick={() => void run(() => setBalances(user.id, Number(superlikes), Number(boosts)))}
        >
          {t.saveBalances}
        </Button>
      </div>
      <Button
        disabled={loading}
        onClick={() => void run(() => setModerationFlag(user.id, !user.profile_moderation_approved))}
      >
        {user.profile_moderation_approved ? t.rejectModeration : t.approveModeration}
      </Button>
    </Card>
  )
}
