export const chatsQueryKeys = {
  all: ['chats'] as const,
  list: (pageSize: number, search = '') => [...chatsQueryKeys.all, 'list', pageSize, search] as const,
}
