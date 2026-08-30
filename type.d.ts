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
  location?: {
    latitude: number
    longitude: number
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
  content: string
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'LOCATION' | string
  senderId: string
  isFromMe: boolean
  createdAt: string
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

export interface ChatNextState {
  inboxList: MockInboxItem[]
  rooms: ChatRoom[]
  pagination?: ChatRoomsPagination
  messagesByChatId: Record<string, ChatNextMessage[]>
  activeChatId?: string
  isLoading: boolean
  getRoomsInProgress: boolean
  getRoomsError: string | null
}

export interface ChatNextActions {
  getRooms$: (params?: GetRoomsParams) => Promise<any>
  setInboxList$: (list: MockInboxItem[]) => void
  addMessage$: (chatId: string, message: ChatNextMessage) => void
  setMessages$: (chatId: string, messages: ChatNextMessage[]) => void
  markAsRead$: (inboxId: string) => void
  deleteConversation$: (inboxId: string) => void
  setActiveChatId$: (chatId?: string) => void
  resetStore$: () => void
}

export type ChatNextStore = ChatNextState & ChatNextActions
