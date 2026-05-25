export const chatsQueryKeys = {
  all: ['chats'] as const,
  list: (pageSize: number) => [...chatsQueryKeys.all, 'list', pageSize] as const,
}
