import RequestMaker from 'Apis/RequestMaker'
import { CHAT_NEXT_APIS } from './apiList'
import { ChatRoomsResponse, GetRoomsParams } from '../type'

export interface ApiFailureResponse {
  isSuccess: false
  message?: string
  error?: any
}

export type GetRoomsResponse = ChatRoomsResponse & { isSuccess: boolean }

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

export default {
  getRooms,
}