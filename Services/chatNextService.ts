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
} from '../type'

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
    } = payload

    const body: Record<string, any> = {
      type,
    }

    if (content !== undefined) {
      body.content = content
    }

    if (isSingleView !== undefined) {
      body.isSingleView = isSingleView
    }

    if (mediaAttachment) {
      body.mediaAttachment = mediaAttachment
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

export default {
  getRooms,
  getRoomMessages,
  sendMessage,
}