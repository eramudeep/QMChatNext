import { ChatNextState } from '../type'
import { MOCK_INBOX_DATA } from '../Screens/Inbox/inbox.screen'

export const initialChatNextState: ChatNextState = {
  inboxList: MOCK_INBOX_DATA,
  rooms: [],
  pagination: undefined,
  messagesByChatId: {},
  activeChatId: undefined,
  isLoading: false,
  getRoomsInProgress: false,
  getRoomsError: null,
}

export default initialChatNextState
