import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ChatNextStore,
  MockInboxItem,
  ChatNextMessage,
  GetRoomsParams,
  ChatRoom,
} from '../type'
import { initialChatNextState } from './initialState'
import { getRooms } from '../Services/chatNextService'

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
        console.log("response=====>", response);
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
