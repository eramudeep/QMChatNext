import React, { useCallback, useMemo } from 'react'
import {
  View,
  RefreshControl,
} from 'react-native'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated'
import { useFocusEffect } from '@react-navigation/native'

// QM-Core Components & Theme
import {
  ScreenWrapper,
  Navbar,
  InfoCard,
  NavbarAction,
  ZeroState,
} from 'Core/Components'

// Navigation & Services
import { simpleNavigate } from 'Navigations/NavigationService'
import routeConst from 'Navigations/routeConst'
import secretStacksRouteConst from 'SecretStacks/Navigation/secretStacksRouteConst'
import homeRoutesConst from 'Home/Navigation/routeConst'
import { chatNextRoutes } from '../../Navigation/routeConst'

// Store, Components & Ads
import { useChatNext } from 'ChatNext/Stores/useChatNext'
import { InboxItem } from 'ChatNext/Components/InboxItem.component'
import { BannerNearYou } from 'Ads/Components'

// Helpers & Redux
import withRedux from 'HOCs/withRedux'

// Types & Styles
import { MockInboxItem, InboxScreenProps } from '../../type'
import styles from './inbox.screen.styles'

export const MOCK_INBOX_DATA: MockInboxItem[] = []

const EmptyInboxZeroState: React.FC = () => (
  <ZeroState
    type="search"
    showActionButton={false}
    onPressClear={() => simpleNavigate(homeRoutesConst.NEAR_BY)}
  />
)

const InboxListHeader: React.FC = () => (
  <View style={styles.adHeaderContainer}>
    <BannerNearYou small />
  </View>
)

const InboxListFooter: React.FC = () => <View style={styles.listFooter} />

export function InboxScreen({ user, appState }: InboxScreenProps) {
  const myProfile = user?.myProfile
  const enableSuperGay = appState?.currentConfig?.enable_super_gay_from_inbox ?? true

  const {
    inboxList = [],
    getRoomsInProgress = false,
    getRooms$,
    markAsRead$,
    deleteConversation$,
  } = useChatNext()


  useFocusEffect(
    useCallback(() => {
      getRooms$({ page: 1 })
    }, [getRooms$]),
  )

  const rightActions: NavbarAction[] = useMemo(() => {
    const actions: NavbarAction[] = []

    if (!myProfile?.is_roaming) {
      actions.push({
        icon: 'Globe',
        onPress: () => simpleNavigate(routeConst.EXPLORE),
        accessibilityLabel: 'Explore',
      })
    }

    actions.push(
      {
        icon: 'Heart',
        onPress: () => simpleNavigate(routeConst.FAV),
        accessibilityLabel: 'Favorites',
      },
      {
        icon: 'Bell',
        onPress: () => simpleNavigate(secretStacksRouteConst.NOTIFICATIONS),
        badgeCount: myProfile?.notification_pending_count ?? 3,
        accessibilityLabel: 'Notifications',
      },
    )

    return actions
  }, [myProfile])

  const handleLeftActionPress = () => {
    simpleNavigate(routeConst.SETTINGS)
  }

  const handleRefresh = () => {
    getRooms$({ page: 1 })
  }

  const handleSelectConversation = (item: MockInboxItem) => {
    markAsRead$(item.id)
    simpleNavigate(chatNextRoutes.ONE_TO_ONE, {
      receiver: {
        _id: item.receiver.id,
        name: item.receiver.full_name,
        avatar: item.receiver.profile_file,
      },
      chatId: item.chat_id,
    })
  }

  const handleDeleteConversation = (id: string) => {
    deleteConversation$(id)
  }

  return (
    <ActionSheetProvider>
      <ScreenWrapper>
        <Navbar
          title="Chats"
          leftAction="menu"
          onLeftActionPress={handleLeftActionPress}
          rightActions={rightActions}
        />

        {enableSuperGay && (
          <View style={styles.boostBannerContainer}>
            <InfoCard
              title="Be Seen. Be Desired"
              subtitle="Your boosted profile shines brighter across Queeny"
              onPress={() => { }}
              status="extended"
              iconName="FireFlame"
            />
          </View>
        )}

        <Animated.FlatList
          entering={FadeInUp}
          exiting={FadeOut}
          data={inboxList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <InboxItem
              item={item}
              onDelete={handleDeleteConversation}
              onSelect={handleSelectConversation}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              onRefresh={handleRefresh}
              refreshing={getRoomsInProgress}
            />
          }
          contentContainerStyle={inboxList.length === 0 ? styles.emptyListContent : undefined}
          ListEmptyComponent={EmptyInboxZeroState}
          ListHeaderComponent={InboxListHeader}
          ListFooterComponent={InboxListFooter}
        />
      </ScreenWrapper>
    </ActionSheetProvider>
  )
}

export default withRedux(InboxScreen)
