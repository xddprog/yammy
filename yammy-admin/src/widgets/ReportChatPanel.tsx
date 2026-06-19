import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchChatBetweenUsers } from '@/entities/admin-auth/api'
import { Button } from '@/shared/ui/primitives'
import { formatDate } from '@/shared/lib/utils'
import { t } from '@/shared/lib/labels'

export function ReportChatPanel({
  reportedUserId,
  reportedUserName,
  reporterId,
  reporterName,
}: {
  reportedUserId: string
  reportedUserName: string
  reporterId: string
  reporterName: string
}) {
  const [open, setOpen] = useState(false)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-chat', reportedUserId, reporterId],
    queryFn: () => fetchChatBetweenUsers(reportedUserId, reporterId),
    enabled: open,
  })

  return (
    <div className="mt-3">
      <Button variant="ghost" onClick={() => setOpen((value) => !value)}>
        {open ? t.hideChat : t.viewChat}
      </Button>
      {open && (
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          {isLoading || isFetching ? (
            <p className="text-sm text-zinc-500">{t.loadingChat}</p>
          ) : !data?.has_chat ? (
            <p className="text-sm text-zinc-500">{t.noChatBetweenUsers}</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {data.messages.map((message) => (
                <div key={message.id} className="rounded-md bg-zinc-950 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-300">
                      {message.sender_id === reporterId ? reporterName : reportedUserName}
                    </span>
                    <span>{formatDate(message.created_at)}</span>
                    {message.is_edited && <span>{t.messageEdited}</span>}
                  </div>
                  {message.content.trim() !== '' && (
                    <p className="mt-1 text-sm text-zinc-200">{message.content}</p>
                  )}
                  {message.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.images.map((image) => (
                        <a
                          key={image.id}
                          href={image.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-md border border-zinc-800"
                        >
                          <img
                            src={image.file_path}
                            alt=""
                            className="max-h-48 max-w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
