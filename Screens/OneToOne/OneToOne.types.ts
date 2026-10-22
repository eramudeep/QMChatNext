export interface OneToOneReceiver {
  _id?: string
  id?: string
  name?: string
  displayName?: string
  avatar?: string
  avatarUrl?: string
  isOnline?: boolean
  [key: string]: any
}

export interface OneToOneRouteParams {
  chatId?: string
  receiver?: OneToOneReceiver
}

export interface OneToOneUser {
  myProfile?: {
    id?: string
    uid?: string
    full_name?: string
    profile_image?: string
    [key: string]: any
  }
  blockedUsersIds?: (string | number)[]
  blockUserSuccess?: boolean
  blockUserFailure?: boolean
  blockUserInProgress?: boolean
  unBlockUserSuccess?: boolean
  unBlockUserFailure?: boolean
  unBlockUserInProgress?: boolean
  error?: any
}

export interface OneToOneScreenProps {
  route?: {
    params?: OneToOneRouteParams
  }
  user?: OneToOneUser
  blockUser$?: (id: string | number, userId: string | number, senderId: string | number) => void
  unBlockUser$?: (id: string | number, userId: string | number, senderId: string | number) => void
  blockUserReset$?: () => void
  unBlockUserReset$?: () => void
}
