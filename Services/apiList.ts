const BASE_URL = 'http://localhost:5001/api/v1' // replace with prod url

export const CHAT_NEXT_APIS = {
  ROOMS: `${BASE_URL}/chats/rooms`,
  MESSAGES: `${BASE_URL}/chats/messages`,
  ROOM_MESSAGES: (roomId: string) => `${BASE_URL}/chats/rooms/${roomId}/messages`,
} as const

export default CHAT_NEXT_APIS
