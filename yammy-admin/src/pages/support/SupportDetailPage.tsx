import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchCurrentStaff,
  fetchSupportConversation,
  fetchSupportMessages,
  replySupportConversation,
  updateSupportConversationStatus,
} from '@/entities/admin-auth/api'
import { Badge, Button, Card, Input } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { labelSupportRequestType, labelSupportStatus, t } from '@/shared/lib/labels'

export function SupportDetailPage() {
  const { conversationId = '' } = useParams()
  const navigate = useNavigate()
  const [reply, setReply] = useState('')

  const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: fetchCurrentStaff })
  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['support-conversation', conversationId],
    queryFn: () => fetchSupportConversation(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 20_000,
  })
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['support-messages', conversationId],
    queryFn: () => fetchSupportMessages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 20_000,
  })

  const replyMutation = useMutation({
    mutationFn: (content: string) => replySupportConversation(conversationId, content),
    onSuccess: () => {
      setReply('')
      void refetchMessages()
      void refetchConversation()
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'open' | 'closed') => updateSupportConversationStatus(conversationId, status),
    onSuccess: () => void refetchConversation(),
  })

  if (!conversation || !staff) {
    return <div className="text-zinc-400">{t.loading}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="text-sm text-zinc-400 hover:text-white" onClick={() => navigate(-1)}>
          {t.back}
        </button>
        <Badge tone={conversation.status === 'open' ? 'success' : 'neutral'}>
          {labelSupportStatus(conversation.status)}
        </Badge>
        {conversation.status === 'open' ? (
          <Button variant="ghost" onClick={() => statusMutation.mutate('closed')}>
            {t.supportCloseTicket}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => statusMutation.mutate('open')}>
            {t.supportReopenTicket}
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="space-y-3">
          <div>
            <div className="text-xs text-zinc-500">{t.supportTicketType}</div>
            <div>{labelSupportRequestType(conversation.request_type)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">{t.supportTelegramId}</div>
            <div>{conversation.telegram_id}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">{t.supportTicketStatus}</div>
            <div>{labelSupportStatus(conversation.status)}</div>
          </div>
          {conversation.user && (
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <div className="text-xs text-zinc-500">{t.supportUser}</div>
              {conversation.user.main_photo && (
                <img src={conversation.user.main_photo} alt="" className="size-16 rounded-lg object-cover" />
              )}
              <div className="font-medium">
                {conversation.user.name}, {conversation.user.age}
              </div>
              <div className="text-sm text-zinc-400">{conversation.user.city}</div>
              {staff.role === 'admin' && (
                <Link to={`/users/${conversation.user.id}`} className="text-sm text-sky-400 hover:underline">
                  {t.users}
                </Link>
              )}
            </div>
          )}
        </Card>

        <Card className="flex min-h-[420px] flex-col">
          <h2 className="mb-3 font-medium">{t.supportMessages}</h2>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages?.items.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.direction === 'staff'
                    ? 'ml-auto bg-sky-900/40 text-sky-50'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                <div className="mb-1 text-xs text-zinc-400">
                  {msg.direction === 'staff' ? t.supportFromStaff : t.supportFromUser}
                  {' · '}
                  {formatDate(msg.created_at)}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.attachment_url && msg.attachment_type === 'photo' && (
                  <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                    <img
                      src={msg.attachment_url}
                      alt=""
                      className="max-h-64 rounded-lg object-contain"
                    />
                  </a>
                )}
                {msg.attachment_url && msg.attachment_type === 'document' && (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sky-400 hover:underline"
                  >
                    {t.supportOpenDocument}
                  </a>
                )}
              </div>
            ))}
          </div>

          {conversation.status === 'open' && (
            <div className="mt-4 flex gap-2 border-t border-zinc-800 pt-4">
              <Input
                className="flex-1"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t.supportReplyPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && reply.trim()) {
                    e.preventDefault()
                    replyMutation.mutate(reply.trim())
                  }
                }}
              />
              <Button
                disabled={!reply.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate(reply.trim())}
              >
                {t.supportReply}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
