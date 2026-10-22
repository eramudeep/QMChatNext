import RequestMaker from 'Apis/RequestMaker'
import { CHAT_NEXT_APIS } from './apiList'
import {
  ChatRoomsResponse,
  GetRoomsParams,
  SendMessagePayload,
  SendMessageResponse,
  GetRoomMessagesParams,
  RoomMessagesResponse,
  MessageType,
  GetChatImagesParams,
} from 'ChatNext/type.d.ts'

export interface ApiFailureResponse {
  isSuccess: false
  message?: string
  error?: any
}

export type GetRoomsResponse = ChatRoomsResponse & { isSuccess: boolean }
export type GetRoomMessagesResponse = RoomMessagesResponse & { isSuccess: boolean }

/**
 * Fetch paginated active chat rooms/conversations for the authenticated user
 * Endpoint: GET /api/v1/chats/rooms
 *
 * @param params Query and header params (page, limit, before, clientToken)
 * @returns Response from RequestMaker
 */
export async function getRooms(
  params: GetRoomsParams = {},
): Promise<GetRoomsResponse | ApiFailureResponse> {
  try {
    const { page = 1, limit = 20, before } = params

    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', String(page))
    if (limit) queryParams.append('limit', String(limit))
    if (before) queryParams.append('before', before)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${CHAT_NEXT_APIS.ROOMS}?${queryString}`
      : CHAT_NEXT_APIS.ROOMS

    const options = {
      method: 'GET',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${getRooms.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while fetching chat rooms',
      error,
    }
  }
}

/**
 * Get message history for a specific room
 * Endpoint: GET /api/v1/chats/rooms/:roomId/messages
 *
 * @param params Query params (roomId, limit, before)
 * @returns Response from RequestMaker
 */
export async function getRoomMessages(
  params: GetRoomMessagesParams,
): Promise<GetRoomMessagesResponse | ApiFailureResponse> {
  try {
    const { roomId, limit = 50, before } = params

    const queryParams = new URLSearchParams()
    if (limit) queryParams.append('limit', String(limit))
    if (before) queryParams.append('before', before)

    const queryString = queryParams.toString()
    const baseUrl = CHAT_NEXT_APIS.ROOM_MESSAGES(roomId)
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

    const options = {
      method: 'GET',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${getRoomMessages.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while fetching room messages',
      error,
    }
  }
}

/**
 * Send a message by specifying either recipientId (direct messaging) OR roomId (existing room)
 * Endpoint: POST /api/v1/chats/messages
 *
 * @param payload Send message payload (recipientId or roomId, type, content)
 * @returns Response from RequestMaker
 */
export async function sendMessage(
  payload: SendMessagePayload,
): Promise<SendMessageResponse | ApiFailureResponse> {
  try {
    const {
      recipientId,
      roomId,
      type = MessageType.TEXT,
      content,
      isSingleView,
      mediaAttachment,
      location,
      file,
    } = payload

    const isLocalMedia =
      !!file ||
      (!!mediaAttachment?.url &&
        !mediaAttachment.url.startsWith('http://') &&
        !mediaAttachment.url.startsWith('https://'))

    if (isLocalMedia) {
      const formData = new FormData()

      if (roomId) {
        formData.append('roomId', roomId)
      } else if (recipientId) {
        formData.append('recipientId', recipientId)
      }

      formData.append('type', String(type || MessageType.IMAGE))

      if (content !== undefined) {
        formData.append('content', content)
      }

      if (isSingleView !== undefined) {
        formData.append('isSingleView', String(isSingleView))
      }

      if (mediaAttachment?.width) {
        formData.append('width', String(mediaAttachment.width))
      }
      if (mediaAttachment?.height) {
        formData.append('height', String(mediaAttachment.height))
      }

      const fileUri = file?.uri || mediaAttachment?.url || ''
      const fileMime = file?.type || mediaAttachment?.mimeType || 'image/jpeg'
      const ext = fileMime.includes('png') ? 'png' : fileMime.includes('webp') ? 'webp' : 'jpg'
      const fileName = file?.name || mediaAttachment?.fileName || `photo_${Date.now()}.${ext}`

      formData.append('file', {
        uri: fileUri,
        type: fileMime,
        name: fileName,
      } as any)

      const options = {
        method: 'POST',
        body: formData,
      }

      return await RequestMaker(CHAT_NEXT_APIS.MESSAGES, options, {
        withAuth: true,
        canJson: true,
        isFormData: true,
      })
    }

    const body: Record<string, any> = {
      type,
    }

    if (content !== undefined) {
      body.content = content
    }

    if (isSingleView !== undefined) {
      body.isSingleView = isSingleView
    }

    if (payload.fileName !== undefined) {
      body.fileName = payload.fileName
    } else if (mediaAttachment) {
      body.mediaAttachment = {
        fileType: mediaAttachment.fileType || 'IMAGE',
        mimeType: mediaAttachment.mimeType || 'image/jpeg',
        fileName: mediaAttachment.fileName || 'photo.jpg',
        fileSize: Number(mediaAttachment.fileSize) || 1048576,
        width: Number(mediaAttachment.width) || 1920,
        height: Number(mediaAttachment.height) || 1080,
        ...mediaAttachment,
      }
    }

    if (location) {
      body.location = location
    }

    if (roomId) {
      body.roomId = roomId
    } else if (recipientId) {
      body.recipientId = recipientId
    }

    const options = {
      method: 'POST',
      body: JSON.stringify(body),
    }

    return await RequestMaker(CHAT_NEXT_APIS.MESSAGES, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${sendMessage.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while sending message',
      error,
    }
  }
}

/**
 * Mark a single-view message as viewed and expired
 * Endpoint: POST /api/v1/chats/messages/:messageId/view
 *
 * @param messageId ID of the single-view message
 * @returns Response from RequestMaker
 */
export async function viewSingleViewMessage(
  messageId: string,
): Promise<any> {
  try {
    const url = CHAT_NEXT_APIS.VIEW_SINGLE_VIEW_MESSAGE(messageId)
    const options = {
      method: 'POST',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${viewSingleViewMessage.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while viewing single-view message',
      error,
    }
  }
}

/**
 * Lists all active images uploaded by the authenticated user
 * Endpoint: GET /api/v1/chats/images
 *
 * @param params Query params (page, limit)
 * @returns Response from RequestMaker
 */
export async function getChatImages(
  params: GetChatImagesParams = {},
): Promise<any> {
  try {
    const { page = 1, limit = 50 } = params
    const queryParams: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    }

    const queryString = new URLSearchParams(queryParams).toString()
    const url = `${CHAT_NEXT_APIS.IMAGES}?${queryString}`

    const options = {
      method: 'GET',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${getChatImages.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while fetching chat images',
      error,
    }
  }
}

/**
 * Soft-deletes a chat image (state_id = 0) owned by the user
 * Endpoint: DELETE /api/v1/chats/images/:id
 *
 * @param imageId ID of the image to delete
 * @returns Response from RequestMaker
 */
export async function deleteChatImage(
  imageId: string | number,
): Promise<any> {
  try {
    const url = CHAT_NEXT_APIS.DELETE_IMAGE(imageId)
    const options = {
      method: 'DELETE',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${deleteChatImage.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while deleting chat image',
      error,
    }
  }
}

/**
 * Soft-deletes a message previously sent by the user
 * Endpoint: DELETE /api/v1/chats/messages/:messageId
 *
 * @param messageId ID of the message to delete
 * @returns Response from RequestMaker
 */
export async function deleteMessage(
  messageId: string,
): Promise<any> {
  try {
    const url = CHAT_NEXT_APIS.DELETE_MESSAGE(messageId)
    const options = {
      method: 'DELETE',
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${deleteMessage.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while deleting message',
      error,
    }
  }
}

/**
 * Likes or unlikes (toggles) a message for the authenticated user
 * Endpoint: POST /api/v1/chats/messages/:messageId/like
 *
 * @param messageId ID of the message to like/unlike
 * @param isLiked Optional explicit boolean state
 * @returns Response from RequestMaker
 */
export async function likeMessage(
  messageId: string,
  isLiked?: boolean,
): Promise<any> {
  try {
    const url = CHAT_NEXT_APIS.LIKE_MESSAGE(messageId)
    const options = {
      method: 'POST',
      ...(isLiked !== undefined ? { body: JSON.stringify({ isLiked }) } : {}),
    }

    return await RequestMaker(url, options, {
      withAuth: true,
      canJson: true,
      isFormData: false,
    })
  } catch (error: any) {
    console.log(`Error in ${likeMessage.name}:`, error)
    return {
      isSuccess: false,
      message: error?.message || 'Error while toggling like on message',
      error,
    }
  }
}

export default {
  getRooms,
  getRoomMessages,
  sendMessage,
  viewSingleViewMessage,
  getChatImages,
  deleteChatImage,
  deleteMessage,
  likeMessage,
}