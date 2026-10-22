const BASE_URL = 'http://localhost:5001/api/v1' // replace with prod url

export const CHAT_NEXT_APIS = {
  ROOMS: `${BASE_URL}/chats/rooms`,
  MESSAGES: `${BASE_URL}/chats/messages`,
  ROOM_MESSAGES: (roomId: string) => `${BASE_URL}/chats/rooms/${roomId}/messages`,
  VIEW_SINGLE_VIEW_MESSAGE: (messageId: string) =>
    `${BASE_URL}/chats/messages/${messageId}/view`,
  IMAGES: `${BASE_URL}/chats/images`,
  DELETE_IMAGE: (id: string | number) => `${BASE_URL}/chats/images/${id}`,
  DELETE_MESSAGE: (messageId: string) => `${BASE_URL}/chats/messages/${messageId}`,
  LIKE_MESSAGE: (messageId: string) => `${BASE_URL}/chats/messages/${messageId}/like`,
} as const

export default CHAT_NEXT_APIS
