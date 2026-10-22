import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ChatNextStore,
  MockInboxItem,
  ChatNextMessage,
  GetRoomsParams,
  SendMessagePayload,
  GetRoomMessagesParams,
  GetChatImagesParams,
} from '../type'
import { initialChatNextState } from './initialState'
import {
  getRooms,
  sendMessage,
  getRoomMessages,
  viewSingleViewMessage,
  getChatImages,
  deleteChatImage,
  deleteMessage,
  likeMessage,
} from '../Services/chatNextService'
import {
  mapRoomToInboxItem,
  mapRoomMessageToGifted,
} from '../Utils/chatUtils'

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
            image: payload.file?.uri || payload.mediaAttachment?.url,
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
              image: sentData.mediaAttachment?.url || payload.file?.uri || payload.mediaAttachment?.url,
              sent: true,
              pending: false,
            }

            if (sentData.mediaAttachment || payload.file || payload.mediaAttachment) {
              get().getChatImages$?.()
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
            item.id === inboxId ? { ...item, unreadCount: 0 } : item,
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

      viewSingleViewMessage$: async (messageId: string, chatId?: string) => {
        set({ viewSingleViewMessageInProgress: true })

        // 1. Optimistically update local message state to expired
        if (chatId) {
          set(state => {
            const currentMessages = state.messagesByChatId[chatId] || []
            const updated = currentMessages.map(msg => {
              if (msg._id === messageId) {
                return {
                  ...msg,
                  isExpired: true,
                  mediaAttachment: null,
                  image: undefined,
                  viewedAt: new Date().toISOString(),
                }
              }
              return msg
            })
            return {
              messagesByChatId: {
                ...state.messagesByChatId,
                [chatId]: updated,
              },
            }
          })
        }

        const response: any = await viewSingleViewMessage(messageId)

        if (response && response.isSuccess !== false && response.success !== false) {
          const viewedData = response.data
          const resolvedChatId = chatId || viewedData?.roomId

          if (resolvedChatId) {
            set(state => {
              const currentMessages = state.messagesByChatId[resolvedChatId] || []
              const updated = currentMessages.map(msg => {
                if (msg._id === messageId) {
                  return {
                    ...msg,
                    isExpired: true,
                    mediaAttachment: null,
                    image: undefined,
                    viewedAt: viewedData?.viewedAt || msg.viewedAt,
                  }
                }
                return msg
              })
              return {
                messagesByChatId: {
                  ...state.messagesByChatId,
                  [resolvedChatId]: updated,
                },
                viewSingleViewMessageInProgress: false,
              }
            })
          } else {
            set({ viewSingleViewMessageInProgress: false })
          }

          return response
        }

        set({ viewSingleViewMessageInProgress: false })
        return response
      },

      getChatImages$: async (params: GetChatImagesParams = {}) => {
        set({
          getChatImagesInProgress: true,
          getChatImagesError: null,
        })

        const response: any = await getChatImages(params)
        if (
          response &&
          response.isSuccess !== false &&
          response.success !== false &&
          Array.isArray(response.data)
        ) {
          const isPaging = params.page && params.page > 1

          set(state => ({
            chatImages: isPaging ? [...state.chatImages, ...response.data] : response.data,
            chatImagesPagination: response.pagination,
            getChatImagesInProgress: false,
            getChatImagesError: null,
          }))

          return response
        }

        set({
          getChatImagesInProgress: false,
          getChatImagesError: response?.message || 'Failed to fetch chat images',
        })

        return response
      },

      deleteChatImage$: async (imageId: string | number) => {
        const previousImages = get().chatImages
        set(state => ({
          chatImages: state.chatImages.filter(img => String(img.id) !== String(imageId)),
          deleteChatImageInProgress: true,
          deleteChatImageError: null,
        }))

        const response: any = await deleteChatImage(imageId)

        if (response && response.isSuccess !== false && response.success !== false) {
          set({
            deleteChatImageInProgress: false,
            deleteChatImageError: null,
          })
          return response
        }

        // Revert on failure
        set({
          chatImages: previousImages,
          deleteChatImageInProgress: false,
          deleteChatImageError: response?.message || 'Failed to delete chat image',
        })

        return response
      },

      deleteMessage$: async (messageId: string, chatId?: string) => {
        const targetChatId = chatId || get().activeChatId || ''
        const previousMessages = targetChatId ? get().messagesByChatId[targetChatId] || [] : []

        if (targetChatId) {
          set(state => ({
            messagesByChatId: {
              ...state.messagesByChatId,
              [targetChatId]: (state.messagesByChatId[targetChatId] || []).filter(
                msg => String(msg._id) !== String(messageId),
              ),
            },
            deleteMessageInProgress: true,
            deleteMessageError: null,
          }))
        }

        const response: any = await deleteMessage(messageId)

        if (response && response.isSuccess !== false && response.success !== false) {
          set({
            deleteMessageInProgress: false,
            deleteMessageError: null,
          })
          return response
        }

        // Revert optimistic removal on failure
        if (targetChatId) {
          set(state => ({
            messagesByChatId: {
              ...state.messagesByChatId,
              [targetChatId]: previousMessages,
            },
            deleteMessageInProgress: false,
            deleteMessageError: response?.message || 'Failed to delete message',
          }))
        }

        return response
      },

      likeMessage$: async (messageId: string, chatId?: string, isLiked?: boolean) => {
        const targetChatId = chatId || get().activeChatId || ''
        const previousMessages = targetChatId ? get().messagesByChatId[targetChatId] || [] : []

        if (targetChatId) {
          set(state => {
            const currentMessages = state.messagesByChatId[targetChatId] || []
            const updated = currentMessages.map(msg => {
              if (String(msg._id) !== String(messageId)) return msg
              const newIsLiked = isLiked !== undefined ? isLiked : !msg.isLiked
              const currentCount = msg.likesCount || (msg.isLiked ? 1 : 0)
              const newCount = Math.max(0, currentCount + (newIsLiked ? (msg.isLiked ? 0 : 1) : (msg.isLiked ? -1 : 0)))
              return {
                ...msg,
                isLiked: newIsLiked,
                likesCount: newCount,
              }
            })
            return {
              messagesByChatId: {
                ...state.messagesByChatId,
                [targetChatId]: updated,
              },
              likeMessageInProgress: true,
              likeMessageError: null,
            }
          })
        }

        const response: any = await likeMessage(messageId, isLiked)

        if (response && response.isSuccess !== false && response.success !== false) {
          const respData = response.data
          const backendIsLiked = respData?.isLiked ?? respData?.message?.isLiked
          const backendLikesCount = respData?.likesCount ?? respData?.message?.likesCount
          const backendLikes = respData?.likes ?? respData?.message?.likes

          if (targetChatId && backendIsLiked !== undefined) {
            set(state => {
              const currentMessages = state.messagesByChatId[targetChatId] || []
              const updated = currentMessages.map(msg => {
                if (String(msg._id) !== String(messageId)) return msg
                return {
                  ...msg,
                  isLiked: backendIsLiked,
                  likesCount: backendLikesCount !== undefined ? backendLikesCount : msg.likesCount,
                  likes: backendLikes !== undefined ? backendLikes : msg.likes,
                }
              })
              return {
                messagesByChatId: {
                  ...state.messagesByChatId,
                  [targetChatId]: updated,
                },
                likeMessageInProgress: false,
                likeMessageError: null,
              }
            })
          } else {
            set({
              likeMessageInProgress: false,
              likeMessageError: null,
            })
          }

          return response
        }

        // Revert optimistic update on failure
        if (targetChatId) {
          set(state => ({
            messagesByChatId: {
              ...state.messagesByChatId,
              [targetChatId]: previousMessages,
            },
            likeMessageInProgress: false,
            likeMessageError: response?.message || 'Failed to toggle like',
          }))
        }

        return response
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
