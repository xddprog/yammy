import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchModerationProfile, moderateProfile } from '@/entities/admin-auth/api'
import { fetchCurrentStaff } from '@/entities/admin-auth/api'
import { Button, Card } from '@/shared/ui/primitives'
import { UserProfilePreview } from '@/widgets/UserProfilePreview'
import { t } from '@/shared/lib/labels'

type ModerationPhoto = {
  id: string
  file_path: string
  order: number
  is_main: boolean
}

export function buildModerationRejectNotes(photos: ModerationPhoto[]): string[] {
  const notes = ['Описание некорректное']
  const sorted = [...photos].sort((a, b) => a.order - b.order)
  const main = sorted.find((photo) => photo.is_main)
  const gallery = sorted.filter((photo) => !photo.is_main)

  if (main) {
    notes.push('Главное фото некорректное')
  }
  gallery.forEach((_, index) => {
    notes.push(`Фото №${index + 1} некорректное`)
  })

  return notes
}

export function ProfileDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [customNote, setCustomNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  const { data, refetch, isLoading } = useQuery({
    queryKey: ['moderation-profile', userId],
    queryFn: () => fetchModerationProfile(userId),
    enabled: Boolean(userId),
  })

  const rejectNotes = useMemo(
    () => (data ? buildModerationRejectNotes(data.photos) : []),
    [data],
  )

  const submitReject = (note: string): void => {
    const trimmed = note.trim()
    if (!trimmed) return
    setSubmitting(true)
    void moderateProfile(userId, false, trimmed)
      .then(() => {
        refetch()
        navigate('/moderation/profiles')
      })
      .finally(() => setSubmitting(false))
  }

  if (isLoading || !data || !staff) return <div className="text-zinc-400">{t.loading}</div>

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
        {t.back}
      </button>
      <UserProfilePreview user={data} />
      <Card className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            disabled={submitting}
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
            disabled={submitting}
            onClick={() => setRejectOpen((open) => !open)}
          >
            {t.reject}
          </Button>
        </div>

        {rejectOpen ? (
          <div className="space-y-3 border-t border-zinc-800 pt-3">
            <p className="text-sm text-zinc-400">Выберите причину — пользователь увидит её в профиле и в Telegram.</p>
            <div className="flex flex-wrap gap-2">
              {rejectNotes.map((note) => (
                <Button
                  key={note}
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => submitReject(note)}
                >
                  {note}
                </Button>
              ))}
            </div>
            <textarea
              value={customNote}
              onChange={(event) => setCustomNote(event.target.value)}
              placeholder="Свой комментарий (необязательно)"
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            />
            {customNote.trim() ? (
              <Button disabled={submitting} onClick={() => submitReject(customNote)}>
                Отклонить с комментарием
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
