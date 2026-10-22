import {
  ChatRoom,
  MockInboxItem,
  RoomMessageItem,
  ChatNextMessage,
} from '../type'

export const mapRoomToInboxItem = (room: ChatRoom): MockInboxItem => {
  const otherUser = room.receiver || room.sender || {}
  return {
    id: room.id,
    chat_id: room.id,
    unreadCount: room.unreadCount || 0,
    receiver: {
      id: String(otherUser.id || room.id),
      full_name: otherUser.displayName || room.name || 'User',
      profile_file: otherUser.avatarUrl || room.avatarUrl || '',
      distance: otherUser.isOnline ? 'Online' : undefined,
    },
    lastMessage: {
      text: room.lastMessage?.content || '',
      image:
        room.lastMessage?.type === 'IMAGE'
          ? room.lastMessage.content || room.lastMessage.mediaAttachment?.url
          : undefined,
      location: room.lastMessage?.type === 'LOCATION',
      audio: room.lastMessage?.type === 'AUDIO',
      created_on: room.lastMessage?.createdAt || room.updatedAt || room.createdAt,
    },
  }
}

export const mapRoomMessageToGifted = (msg: RoomMessageItem): ChatNextMessage => ({
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
  isExpired: msg.isExpired,
  viewedAt: msg.viewedAt,
  mediaAttachment: msg.mediaAttachment,
  image: msg.mediaAttachment?.url,
  likes: msg.likes,
  likesCount: msg.likesCount,
  isLiked: msg.isLiked,
  sent: true,
})

export default {
  mapRoomToInboxItem,
  mapRoomMessageToGifted,
}
