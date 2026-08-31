import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ChatNextStore,
  MockInboxItem,
  ChatNextMessage,
  GetRoomsParams,
  ChatRoom,
  SendMessagePayload,
  GetRoomMessagesParams,
  RoomMessageItem,
} from '../type'
import { initialChatNextState } from './initialState'
import { getRooms, sendMessage, getRoomMessages } from '../Services/chatNextService'

const mapRoomToInboxItem = (room: ChatRoom): MockInboxItem => {
  const otherUser = room.receiver || room.sender || {}
  return {
    id: room.id,
    chat_id: room.id,
    pendingCount: room.unreadCount || 0,
    receiver: {
      id: String(otherUser.id || room.id),
      full_name: otherUser.displayName || room.name || 'User',
      profile_file: otherUser.avatarUrl || room.avatarUrl || '',
      distance: otherUser.isOnline ? 'Online' : undefined,
    },
    lastMessage: {
      text: room.lastMessage?.content || '',
      image: room.lastMessage?.type === 'IMAGE' ? room.lastMessage.content : undefined,
      location: room.lastMessage?.type === 'LOCATION',
      audio: room.lastMessage?.type === 'AUDIO',
      created_on: room.lastMessage?.createdAt || room.updatedAt || room.createdAt,
    },
  }
}

const mapRoomMessageToGifted = (msg: RoomMessageItem): ChatNextMessage => ({
  _id: msg.id,
  text: msg.content || (msg.location ? (msg.location.name || '📍 Location') : ''),
  createdAt: msg.createdAt,
  user: {
    _id: String(msg.senderId || msg.sender?.id || ''),
    name: msg.sender?.displayName,
    avatar: msg.sender?.avatarUrl || undefined,
  },
  location: msg.location,
  isSingleView: msg.isSingleView,
  mediaAttachment: msg.mediaAttachment,
  image: msg.mediaAttachment?.url,
  sent: true,
})

export const useChatNext = create<ChatNextStore>()(
  persist(
    (set, get) => ({
      ...initialChatNextState,

      getRooms$: async (params: GetRoomsParams = {}) => {
        set({
          isLoading: true,
          getRoomsInProgress: true,
          getRoomsError: null,
        })

        const response: any = await getRooms(params)
        if (
          response &&
          response.isSuccess !== false &&
          response.success !== false &&
          Array.isArray(response.data)
        ) {
          const mappedInbox: MockInboxItem[] = response.data.map(mapRoomToInboxItem)
          const isPaging = params.page && params.page > 1

          set(state => ({
            inboxList: isPaging ? [...state.inboxList, ...mappedInbox] : mappedInbox,
            rooms: isPaging ? [...state.rooms, ...response.data] : response.data,
            pagination: response.pagination,
            isLoading: false,
            getRoomsInProgress: false,
            getRoomsError: null,
          }))

          return response
        }

        set({
          isLoading: false,
          getRoomsInProgress: false,
          getRoomsError: response?.message || 'Failed to fetch rooms',
        })

        return response
      },

      getRoomMessages$: async (params: GetRoomMessagesParams) => {
        const { roomId, before } = params
        set({
          getRoomMessagesInProgress: true,
          getRoomMessagesError: null,
        })

        const response: any = await getRoomMessages(params)

        if (
          response &&
          response.isSuccess !== false &&
          response.success !== false &&
          Array.isArray(response.data)
        ) {
          const mappedMessages: ChatNextMessage[] = response.data.map(mapRoomMessageToGifted)

          set(state => {
            const current = state.messagesByChatId[roomId] || []
            const merged = before ? [...current, ...mappedMessages] : mappedMessages
            const seen = new Set<string>()
            const deduplicatedAndSorted = merged
              .filter(m => {
                if (!m._id || seen.has(m._id)) return false
                seen.add(m._id)
                return true
              })
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )

            return {
              messagesByChatId: {
                ...state.messagesByChatId,
                [roomId]: deduplicatedAndSorted,
              },
              getRoomMessagesInProgress: false,
              getRoomMessagesError: null,
            }
          })

          return response
        }

        set({
          getRoomMessagesInProgress: false,
          getRoomMessagesError: response?.message || 'Failed to fetch room messages',
        })

        return response
      },

      sendMessage$: async (payload: SendMessagePayload, senderId?: string) => {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const targetChatId = payload.roomId || payload.recipientId || ''

        // 1. Immediately render optimistic message in chat
        if (targetChatId) {
          const optimisticMessage: ChatNextMessage = {
            _id: tempId,
            text: payload.content || (payload.location ? (payload.location.name || '📍 Location') : ''),
            createdAt: new Date().toISOString(),
            user: {
              _id: String(senderId || 'me'),
            },
            location: payload.location,
            isSingleView: payload.isSingleView,
            mediaAttachment: payload.mediaAttachment,
            image: payload.mediaAttachment?.url,
            pending: true,
            sent: false,
          }
          get().addMessage$(targetChatId, optimisticMessage)
        }

        set({
          sendMessageInProgress: true,
          sendMessageError: null,
        })

        const response: any = await sendMessage(payload)

        if (response && response.isSuccess !== false && response.success !== false) {
          const sentData = response.data
          const resolvedChatId = payload.roomId || sentData?.roomId || targetChatId

          if (resolvedChatId && sentData) {
            const confirmedMessage: ChatNextMessage = {
              _id: sentData.id,
              text: sentData.content || (sentData.location ? (sentData.location.name || '📍 Location') : payload.content),
              createdAt: sentData.createdAt,
              user: {
                _id: String(sentData.senderId || senderId || 'me'),
              },
              location: sentData.location || payload.location,
              isSingleView: sentData.isSingleView !== undefined ? sentData.isSingleView : payload.isSingleView,
              mediaAttachment: sentData.mediaAttachment || payload.mediaAttachment,
              image: sentData.mediaAttachment?.url || payload.mediaAttachment?.url,
              sent: true,
              pending: false,
            }

            // Replace optimistic temporary message with confirmed server message
            set(state => {
              const currentMessages = state.messagesByChatId[resolvedChatId] || []
              const replacedMessages = currentMessages.map(msg =>
                msg._id === tempId ? confirmedMessage : msg,
              )
              const hasConfirmed = replacedMessages.some(msg => msg._id === confirmedMessage._id)
              const finalMessages = hasConfirmed
                ? replacedMessages
                : [confirmedMessage, ...currentMessages.filter(m => m._id !== tempId)]

              return {
                messagesByChatId: {
                  ...state.messagesByChatId,
                  [resolvedChatId]: finalMessages,
                },
              }
            })
          }

          set({
            sendMessageInProgress: false,
            sendMessageError: null,
          })

          return response
        }

        // On network/server failure, clear pending status
        if (targetChatId) {
          set(state => {
            const currentMessages = state.messagesByChatId[targetChatId] || []
            return {
              messagesByChatId: {
                ...state.messagesByChatId,
                [targetChatId]: currentMessages.map(msg =>
                  msg._id === tempId ? { ...msg, pending: false, sent: false } : msg,
                ),
              },
            }
          })
        }

        set({
          sendMessageInProgress: false,
          sendMessageError: response?.message || 'Failed to send message',
        })

        return response
      },

      setInboxList$: (list: MockInboxItem[]) => {
        set({ inboxList: list })
      },

      addMessage$: (chatId: string, message: ChatNextMessage) => {
        set(state => {
          const currentMessages = state.messagesByChatId[chatId] || []
          const updatedMessages = [message, ...currentMessages]

          // Update corresponding inbox lastMessage preview if conversation exists
          const updatedInbox = state.inboxList.map(item => {
            if (item.chat_id === chatId) {
              return {
                ...item,
                lastMessage: {
                  text: message.text,
                  image: message.image,
                  audio: !!message.audio,
                  location: !!message.location,
                  created_on: new Date(message.createdAt).toISOString(),
                },
              }
            }
            return item
          })

          return {
            messagesByChatId: {
              ...state.messagesByChatId,
              [chatId]: updatedMessages,
            },
            inboxList: updatedInbox,
          }
        })
      },

      setMessages$: (chatId: string, messages: ChatNextMessage[]) => {
        set(state => ({
          messagesByChatId: {
            ...state.messagesByChatId,
            [chatId]: messages,
          },
        }))
      },

      markAsRead$: (inboxId: string) => {
        set(state => ({
          inboxList: state.inboxList.map(item =>
            item.id === inboxId ? { ...item, pendingCount: 0 } : item,
          ),
        }))
      },

      deleteConversation$: (inboxId: string) => {
        const item = get().inboxList.find(c => c.id === inboxId)
        set(state => {
          const nextMessages = { ...state.messagesByChatId }
          if (item?.chat_id) {
            delete nextMessages[item.chat_id]
          }
          return {
            inboxList: state.inboxList.filter(c => c.id !== inboxId),
            messagesByChatId: nextMessages,
          }
        })
      },

      setActiveChatId$: (chatId?: string) => {
        set({ activeChatId: chatId })
      },

      resetStore$: () => {
        set(initialChatNextState)
      },
    }),
    {
      name: 'qm-chat-next-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

export default useChatNext
