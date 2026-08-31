import { MessageType } from './enum'

export { MessageType }

export interface MockInboxReceiver {
  id: string
  full_name: string
  profile_file: string
  age?: number
  distance?: string
}

export interface MockInboxLastMessage {
  text?: string
  image?: string
  location?: boolean
  audio?: boolean
  created_on: string
}

export interface MockInboxItem {
  id: string
  chat_id: string
  pendingCount?: number
  receiver: MockInboxReceiver
  lastMessage: MockInboxLastMessage
}

export interface InboxScreenProps {
  user?: {
    myProfile?: {
      id?: string
      full_name?: string
      is_roaming?: boolean
      notification_pending_count?: number
    }
  }
  appState?: {
    currentConfig?: {
      enable_super_gay_from_inbox?: boolean
    }
  }
}

export interface InboxItemProps {
  item: MockInboxItem
  onDelete: (id: string) => void
  onSelect: (item: MockInboxItem) => void
}

export interface SendLocationPayload {
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface MediaAttachmentPayload {
  url: string
  fileType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | string
  mimeType?: string
  fileName?: string
  fileSize?: number
  thumbnailUrl?: string
  width?: number
  height?: number
}

export interface ChatNextMessage {
  _id: string
  text?: string
  createdAt: string | number | Date
  user: {
    _id: string
    name?: string
    avatar?: string
  }
  image?: string
  audio?: string
  isSingleView?: boolean
  mediaAttachment?: MediaAttachmentPayload
  location?: SendLocationPayload | {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
  pending?: boolean
  sent?: boolean
  received?: boolean
}

export interface ChatUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isOnline: boolean
  lastSeenAt: string | null
}

export interface ChatRoomLastMessage {
  id: string
  content?: string
  type: MessageType | string
  senderId: string
  isFromMe: boolean
  createdAt: string
  isSingleView?: boolean
  mediaAttachment?: MediaAttachmentPayload
  location?: SendLocationPayload
}

export interface ChatRoom {
  id: string
  name: string
  type: 'DIRECT' | 'GROUP' | string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  sender: ChatUser
  receiver: ChatUser
  lastMessage: ChatRoomLastMessage
  unreadCount: number
}

export interface ChatRoomsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface ChatRoomsResponse {
  success: boolean
  message: string
  data: ChatRoom[]
  pagination: ChatRoomsPagination
}

export interface GetRoomsParams {
  page?: number
  limit?: number
  before?: string
  clientToken?: string
}

export interface GetRoomMessagesParams {
  roomId: string
  limit?: number
  before?: string
}

export interface RoomMessageItem {
  id: string
  roomId: string
  senderId: string
  type: MessageType | string
  content?: string
  isSingleView?: boolean
  mediaAttachment?: MediaAttachmentPayload
  location?: SendLocationPayload
  isFromMe: boolean
  createdAt: string
  sender?: {
    id: string
    displayName: string
    avatarUrl?: string | null
  }
}

export interface RoomMessagesResponse {
  success: boolean
  message: string
  data: RoomMessageItem[]
}

export interface SendMessagePayload {
  recipientId?: string
  roomId?: string
  type?: MessageType | keyof typeof MessageType | string
  content?: string
  isSingleView?: boolean
  mediaAttachment?: MediaAttachmentPayload
  location?: SendLocationPayload
}

export interface SendMessageResponse {
  success: boolean
  message?: string
  data?: {
    id: string
    roomId: string
    senderId: string
    type: MessageType | string
    content?: string
    isSingleView?: boolean
    mediaAttachment?: MediaAttachmentPayload
    location?: SendLocationPayload
    createdAt: string
    updatedAt?: string
    [key: string]: any
  }
  isSuccess?: boolean
  error?: any
}

export interface ChatNextState {
  inboxList: MockInboxItem[]
  rooms: ChatRoom[]
  pagination?: ChatRoomsPagination
  messagesByChatId: Record<string, ChatNextMessage[]>
  activeChatId?: string
  isLoading: boolean
  getRoomsInProgress: boolean
  getRoomsError: string | null
  getRoomMessagesInProgress: boolean
  getRoomMessagesError: string | null
  sendMessageInProgress: boolean
  sendMessageError: string | null
}

export interface ChatNextActions {
  getRooms$: (params?: GetRoomsParams) => Promise<any>
  getRoomMessages$: (params: GetRoomMessagesParams) => Promise<any>
  sendMessage$: (payload: SendMessagePayload, senderId?: string) => Promise<any>
  setInboxList$: (list: MockInboxItem[]) => void
  addMessage$: (chatId: string, message: ChatNextMessage) => void
  setMessages$: (chatId: string, messages: ChatNextMessage[]) => void
  markAsRead$: (inboxId: string) => void
  deleteConversation$: (inboxId: string) => void
  setActiveChatId$: (chatId?: string) => void
  resetStore$: () => void
}

export type ChatNextStore = ChatNextState & ChatNextActions
