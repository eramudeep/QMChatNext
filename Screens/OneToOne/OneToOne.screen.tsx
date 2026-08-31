import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import { View, Alert, Pressable, Platform, Linking, Image } from 'react-native'
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Composer,
  Send,
  Actions,
  IMessage,
} from 'react-native-gifted-chat'
import {
  ActionSheetProvider,
  useActionSheet,
} from '@expo/react-native-action-sheet'
import MapView, { Marker } from 'react-native-maps'

// QM-Core Components & Theme
import {
  ScreenWrapper,
  Navbar,
  Avatar,
  Typography,
  Card,
  Icon,
  NavbarAction,
  BottomSheetRef,
} from 'Core/Components'
import { useTheme } from 'QM-Core'

// Navigation & Services
import { goBack, simpleNavigate } from 'Navigations/NavigationService'
import SendLocation from 'Screens/Chat/OneToOne/SendLocation'
import ZoomViewer from 'Screens/PrivateAlbums/ZoomViewer'
import expiringPhotosRoutes from 'ExpiringPhotos/Navigations/routeConst'
import { SendImageWidget } from 'QMExpiringPhotos/Widgets'
import useImageGallary from 'Hooks/useImageGallary'
import imagePicker, { imageCameraPicker } from 'Utils/imagePicker'

// Store & Helpers
import { useChatNext } from 'ChatNext/Stores/useChatNext'
import withRedux from 'HOCs/withRedux'

// Types & Styles
import { ChatNextMessage, SendLocationPayload, MediaAttachmentPayload } from '../../type'
import styles from './OneToOne.screen.styles'
import { MessageType } from 'ChatNext/enum'

export interface OneToOneScreenProps {
  route?: {
    params?: {
      chatId?: string
      receiver?: {
        _id?: string
        id?: string
        name?: string
        displayName?: string
        avatar?: string
        avatarUrl?: string
        isOnline?: boolean
        [key: string]: any
      }
    }
  }
  user?: {
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
  blockUser$?: (id: string | number, userId: string | number, senderId: string | number) => void
  unBlockUser$?: (id: string | number, userId: string | number, senderId: string | number) => void
  blockUserReset$?: () => void
  unBlockUserReset$?: () => void
}

const PlusActionIcon = () => <Icon name="Plus" size="lg" color="brand" />

function OneToOneContent({
  route,
  user,
  blockUser$,
  unBlockUser$,
  blockUserReset$,
  unBlockUserReset$,
}: OneToOneScreenProps) {
  const { colors } = useTheme()
  const { showActionSheetWithOptions } = useActionSheet()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  const sendImageWidgetRef = useRef<BottomSheetRef>(null)
  const { list: galleryList } = useImageGallary()

  const chatId = route?.params?.chatId || ''
  const receiver = route?.params?.receiver
  const receiverId = receiver?._id || receiver?.id
  const receiverName = receiver?.displayName || receiver?.name || 'Chat'
  const receiverAvatar = receiver?.avatarUrl || receiver?.avatar
  const isOnline = receiver?.isOnline

  const myId = user?.myProfile?.id || user?.myProfile?.uid || 'me'
  const myName = user?.myProfile?.full_name || 'Me'
  const myAvatar = user?.myProfile?.profile_image

  const isBlocked = useMemo(() => {
    if (!receiverId || !user?.blockedUsersIds) return false
    return user.blockedUsersIds.some(id => String(id) === String(receiverId))
  }, [receiverId, user?.blockedUsersIds])

  const {
    messagesByChatId = {},
    sendMessage$,
    getRoomMessages$,
    getRoomMessagesInProgress = false,
    deleteConversation$,
  } = useChatNext()

  useEffect(() => {
    if (chatId) {
      getRoomMessages$({ roomId: chatId })
    }
  }, [chatId, getRoomMessages$])

  useEffect(() => {
    if (user?.blockUserSuccess) {
      blockUserReset$?.()
      if (chatId) {
        deleteConversation$(chatId)
      }
      goBack()
    }
    if (user?.blockUserFailure) {
      blockUserReset$?.()
      Alert.alert('Error', user?.error?.message || 'Failed to block user. Please try again.')
    }
  }, [
    user?.blockUserSuccess,
    user?.blockUserFailure,
    user?.error,
    blockUserReset$,
    deleteConversation$,
    chatId,
  ])

  useEffect(() => {
    if (user?.unBlockUserSuccess) {
      unBlockUserReset$?.()
      Alert.alert('Success', `${receiverName} has been unblocked.`)
    }
    if (user?.unBlockUserFailure) {
      unBlockUserReset$?.()
      Alert.alert('Error', user?.error?.message || 'Failed to unblock user.')
    }
  }, [user?.unBlockUserSuccess, user?.unBlockUserFailure, user?.error, unBlockUserReset$, receiverName])

  useEffect(() => {
    return () => {
      blockUserReset$?.()
      unBlockUserReset$?.()
    }
  }, [blockUserReset$, unBlockUserReset$])

  const rawMessages: ChatNextMessage[] = useMemo(() => {
    return messagesByChatId[chatId] || []
  }, [messagesByChatId, chatId])

  const giftedMessages: IMessage[] = useMemo(() => {
    return [...rawMessages]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map(msg => ({
        _id: msg._id || String(Math.random()),
        text: msg.text || '',
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        user: {
          _id: msg.user?._id || '',
          name: msg.user?.name || (String(msg.user?._id) === String(myId) ? myName : receiverName),
          avatar: msg.user?.avatar || (String(msg.user?._id) === String(myId) ? myAvatar : receiverAvatar),
        },
        image: msg.image || msg.mediaAttachment?.url,
        audio: msg.audio,
        location: msg.location,
        isSingleView: msg.isSingleView,
        mediaAttachment: msg.mediaAttachment,
        sent: msg.sent,
        received: msg.received,
        pending: msg.pending,
      }))
  }, [rawMessages, myId, myName, myAvatar, receiverName, receiverAvatar])

  const handleMorePress = useCallback(() => {
    const options = [isBlocked ? 'Unblock User' : 'Block User', 'Cancel']
    const destructiveButtonIndex = isBlocked ? undefined : 0
    const cancelButtonIndex = 1

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      selectedIndex => {
        if (selectedIndex === 0 && receiverId) {
          if (isBlocked) {
            unBlockUser$?.(receiverId, receiverId, myId)
          } else {
            Alert.alert(
              'Block User',
              `Are you sure you want to block ${receiverName}? They will no longer be able to message you.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Block',
                  style: 'destructive',
                  onPress: () => {
                    blockUser$?.(receiverId, receiverId, myId)
                  },
                },
              ],
            )
          }
        }
      },
    )
  }, [isBlocked, receiverId, myId, receiverName, showActionSheetWithOptions, blockUser$, unBlockUser$])

  const rightActions: NavbarAction[] = useMemo(() => {
    return [
      {
        icon: 'Phone',
        onPress: () => {},
        accessibilityLabel: 'Voice Call',
      },
      {
        icon: 'WarningCircle',
        onPress: handleMorePress,
        accessibilityLabel: 'More Options',
      },
    ]
  }, [handleMorePress])

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const firstMsg = newMessages[0]
      if (!firstMsg || !firstMsg.text?.trim() || isBlocked) return

      await sendMessage$(
        {
          roomId: chatId || undefined,
          recipientId: receiverId ? String(receiverId) : undefined,
          type: MessageType.TEXT,
          content: firstMsg.text.trim(),
        },
        String(myId),
      )
    },
    [chatId, receiverId, isBlocked, sendMessage$, myId],
  )

  const handleSendLocation = useCallback(
    async (loc: { latitude: number; longitude: number }, name?: string) => {
      setShowLocationModal(false)
      if (isBlocked) return

      const locationPayload: SendLocationPayload = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: name || '📍 Shared Location',
      }

      await sendMessage$(
        {
          roomId: chatId || undefined,
          recipientId: receiverId ? String(receiverId) : undefined,
          type: MessageType.LOCATION,
          content: name || '📍 Shared Location',
          location: locationPayload,
        },
        String(myId),
      )
    },
    [chatId, receiverId, isBlocked, sendMessage$, myId],
  )

  const handleSendPhotoCallback = useCallback(
    async ({ uri, mime, file_name, willExpire, caption }: {
      existing?: boolean
      file_name?: string
      uri: string
      mime?: string
      willExpire?: boolean
      caption?: string
    }) => {
      goBack()
      if (isBlocked) return

      const mediaAttachment: MediaAttachmentPayload = {
        url: uri,
        fileType: 'IMAGE',
        mimeType: mime || 'image/jpeg',
        fileName: file_name || 'photo.jpg',
        width: 1920,
        height: 1080,
      }

      await sendMessage$(
        {
          roomId: chatId || undefined,
          recipientId: receiverId ? String(receiverId) : undefined,
          type: MessageType.IMAGE,
          content: caption || (willExpire ? '🔒 View once photo' : '📷 Photo'),
          isSingleView: willExpire,
          mediaAttachment,
        },
        String(myId),
      )
    },
    [chatId, receiverId, isBlocked, sendMessage$, myId],
  )

  const handlePressCamera = useCallback(async () => {
    sendImageWidgetRef.current?.hide()
    const { path, mime } = await imageCameraPicker()
    if (path) {
      simpleNavigate(expiringPhotosRoutes.SEND_PHOTO, {
        mime,
        uri: path,
        name: receiverName,
        callBack: handleSendPhotoCallback,
      })
    }
  }, [receiverName, handleSendPhotoCallback])

  const handlePressUploadNew = useCallback(async () => {
    sendImageWidgetRef.current?.hide()
    const { path, mime } = await imagePicker()
    if (path) {
      simpleNavigate(expiringPhotosRoutes.SEND_PHOTO, {
        mime,
        uri: path,
        name: receiverName,
        callBack: handleSendPhotoCallback,
      })
    }
  }, [receiverName, handleSendPhotoCallback])

  const handlePressExisting = useCallback(
    ({ file_name, uri }: { file_name: string; uri: string }) => {
      sendImageWidgetRef.current?.hide()
      simpleNavigate(expiringPhotosRoutes.SEND_PHOTO, {
        existing: true,
        uri,
        file_name,
        name: receiverName,
        callBack: handleSendPhotoCallback,
      })
    },
    [receiverName, handleSendPhotoCallback],
  )

  const renderCustomView = (props: any) => {
    const { currentMessage } = props
    const isMyMsg = String(currentMessage?.user?._id) === String(myId)

    // 1. Single View (View-Once) Photo
    if (currentMessage?.isSingleView) {
      const imgUrl = currentMessage?.image || currentMessage?.mediaAttachment?.url
      return (
        <Pressable
          onPress={() => {
            if (imgUrl) setZoomImageUrl(imgUrl)
          }}
          style={[
            styles.singleViewWrapper,
            isMyMsg
              ? styles.singleViewWrapperMy
              : { backgroundColor: colors.surfaceInput },
          ]}
        >
          <Icon name="EyeClosed" size="lg" color="brand" />
          <View style={styles.singleViewTextContainer}>
            <Typography
              variant="label"
              customColor={isMyMsg ? colors.white : colors.textPrimary}
            >
              {currentMessage?.text || 'View Once Photo'}
            </Typography>
            <Typography
              variant="caption"
              customColor={isMyMsg ? 'rgba(255, 255, 255, 0.7)' : colors.textTertiary}
            >
              Self-destructs after opening
            </Typography>
          </View>
          <View
            style={[
              styles.singleViewBadge,
              isMyMsg
                ? styles.singleViewBadgeMy
                : { backgroundColor: colors.primaryLight },
            ]}
          >
            <Typography
              variant="caption"
              customColor={isMyMsg ? colors.white : colors.primary}
            >
              1 View
            </Typography>
          </View>
        </Pressable>
      )
    }

    // 2. Regular Media Attachment Photo
    if (currentMessage?.mediaAttachment?.url || currentMessage?.image) {
      const imgUrl = currentMessage?.mediaAttachment?.url || currentMessage?.image
      return (
        <Pressable
          onPress={() => setZoomImageUrl(imgUrl)}
          style={styles.mediaImageWrapper}
        >
          <Image
            source={{ uri: imgUrl }}
            resizeMode="cover"
            style={styles.mediaImage}
          />
        </Pressable>
      )
    }

    // 3. Location Message
    const location = currentMessage?.location
    if (location?.latitude && location?.longitude) {
      const handleOpenMap = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' })
        const latLng = `${location.latitude},${location.longitude}`
        const label = encodeURIComponent(location.name || receiverName || 'Location')
        const url = Platform.select({
          ios: `${scheme}${label}@${latLng}`,
          android: `${scheme}${latLng}(${label})`,
        })
        if (url) {
          Linking.openURL(url)
        }
      }

      return (
        <Pressable onPress={handleOpenMap} style={styles.locationWrapper}>
          <MapView
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            initialRegion={{
              latitude: Number(location.latitude) || 37.7749,
              longitude: Number(location.longitude) || -122.4194,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            style={styles.locationMap}
          >
            <Marker
              coordinate={{
                latitude: Number(location.latitude) || 37.7749,
                longitude: Number(location.longitude) || -122.4194,
              }}
            />
          </MapView>
          <View style={styles.locationInfo}>
            <Typography
              variant="label"
              customColor={isMyMsg ? colors.white : colors.textPrimary}
            >
              {location.name || 'Shared Location'}
            </Typography>
            {location.address && (
              <Typography
                variant="caption"
                customColor={isMyMsg ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
              >
                {location.address}
              </Typography>
            )}
          </View>
        </Pressable>
      )
    }

    return null
  }

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        renderCustomView={renderCustomView}
        wrapperStyle={{
          right: [
            styles.bubbleWrapperRight,
            { backgroundColor: colors.primary },
          ],
          left: [
            styles.bubbleWrapperLeft,
            { backgroundColor: colors.surfaceInputFilled },
          ],
        }}
        textStyle={{
          right: {
            color: colors.white,
            fontSize: 15,
            lineHeight: 20,
          },
          left: {
            color: colors.textPrimary,
            fontSize: 15,
            lineHeight: 20,
          },
        }}
        timeTextStyle={{
          right: { color: 'rgba(255, 255, 255, 0.7)' },
          left: { color: colors.textTertiary },
        }}
      />
    )
  }

  const renderActions = (props: any) => {
    return (
      <Actions
        {...props}
        containerStyle={styles.actionsContainer}
        icon={PlusActionIcon}
        options={{
          'Send Photo': () => sendImageWidgetRef.current?.show(),
          'Take Photo': handlePressCamera,
          'Choose from Gallery': handlePressUploadNew,
          'Share Location': () => setShowLocationModal(true),
          Cancel: () => {},
        }}
        optionTintColor={colors.textPrimary}
      />
    )
  }

  const renderInputToolbar = (props: any) => {
    if (isBlocked) {
      return (
        <View
          style={[
            styles.blockedBanner,
            {
              backgroundColor: colors.surfaceDefault,
              borderTopColor: colors.borderDefault,
            },
          ]}
        >
          <Typography variant="bodySm" color="secondary" align="center">
            You have blocked {receiverName}. Unblock to continue chatting.
          </Typography>
        </View>
      )
    }

    return (
      <InputToolbar
        {...props}
        containerStyle={[
          styles.inputToolbar,
          {
            backgroundColor: colors.surfaceDefault,
            borderTopColor: colors.borderDefault,
          },
        ]}
        primaryStyle={styles.inputToolbarPrimary}
        renderActions={renderActions}
      />
    )
  }

  const renderComposer = (props: any) => {
    return (
      <Composer
        {...props}
        textInputStyle={[
          styles.composer,
          {
            backgroundColor: colors.surfaceInputFilled,
            color: colors.textPrimary,
          },
        ]}
        placeholder="Type a message..."
        placeholderTextColor={colors.textPlaceholder}
        multiline={false}
      />
    )
  }

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        disabled={!props.text?.trim()}
        containerStyle={styles.sendContainer}
      >
        <View style={styles.sendIconWrapper}>
          <Icon name="Send" size="lg" color="brand" />
        </View>
      </Send>
    )
  }

  const renderAvatar = (props: any) => {
    const isMe = String(props?.currentMessage?.user?._id) === String(myId)
    if (isMe) return null

    return (
      <View style={styles.avatarContainer}>
        <Avatar
          source={{ uri: receiverAvatar }}
          initials={receiverName ? receiverName.charAt(0).toUpperCase() : 'U'}
          size="sm"
        />
      </View>
    )
  }

  const renderChatEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <Card variant="filled" radius="3xl" style={styles.emptyCard}>
          <Avatar
            source={{ uri: receiverAvatar }}
            initials={receiverName ? receiverName.charAt(0).toUpperCase() : 'U'}
            size="xl"
          />
          <Typography variant="h4" style={styles.emptyTitle}>
            {receiverName}
          </Typography>
          <Typography variant="bodySm" color="secondary" style={styles.emptySubtitle}>
            Say hello to start the conversation!
          </Typography>
        </Card>
      </View>
    )
  }

  return (
    <ScreenWrapper>
      <Navbar
        title={receiverName}
        subtitle={isOnline ? 'Online' : 'Offline'}
        leftAction="back"
        onLeftActionPress={goBack}
        rightActions={rightActions}
      />

      <GiftedChat
        messages={giftedMessages}
        onSend={onSend}
        user={{
          _id: String(myId),
          name: myName,
          avatar: myAvatar,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}
        renderSend={renderSend}
        renderAvatar={renderAvatar}
        renderChatEmpty={renderChatEmpty}
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        isLoadingEarlier={getRoomMessagesInProgress}
        alwaysShowSend
        scrollToBottom
      />

      {showLocationModal && (
        <SendLocation
          isVisible={showLocationModal}
          toggleModal={() => setShowLocationModal(false)}
          receiver={receiverName}
          sendLocation={handleSendLocation}
        />
      )}

      <SendImageWidget
        sendImageWidgetRef={sendImageWidgetRef}
        list={galleryList}
        onPressExisting={handlePressExisting}
        onPressCamera={handlePressCamera}
        onPressUploadNew={handlePressUploadNew}
      />

      <ZoomViewer
        imgUrl={zoomImageUrl}
        isVisible={!!zoomImageUrl}
        toggleModal={() => setZoomImageUrl(null)}
      />
    </ScreenWrapper>
  )
}

export function OneToOneScreen(props: OneToOneScreenProps) {
  return (
    <ActionSheetProvider>
      <OneToOneContent {...props} />
    </ActionSheetProvider>
  )
}

export default withRedux(OneToOneScreen)
