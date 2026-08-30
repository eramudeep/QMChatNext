import React, {useMemo, useState} from 'react';
import {
  View,
  RefreshControl,
} from 'react-native';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import Animated, {FadeInUp, FadeOut} from 'react-native-reanimated';

// QM-Core Components & Theme
import {
  ScreenWrapper,
  Navbar,
  InfoCard,
  Typography,
  Card,
  Button,
  NavbarAction,
} from 'Core/Components';

// Navigation & Services
import {simpleNavigate} from 'Navigations/NavigationService';
import routeConst from 'Navigations/routeConst';
import secretStacksRouteConst from 'SecretStacks/Navigation/secretStacksRouteConst';
import homeRoutesConst from 'Home/Navigation/routeConst';
import {chatNextRoutes} from '../../Navigation/routeConst';

// Components & Ads
import {InboxItem} from '../../Components/InboxItem.component';
import {BannerNearYou} from 'Ads/Components';

// Helpers & Redux
import withRedux from 'HOCs/withRedux';

// Types & Styles
import {MockInboxItem, InboxScreenProps} from '../../type';
import styles from './inbox.screen.styles';

export const MOCK_INBOX_DATA: MockInboxItem[] = [
  {
    id: 'inbox_1',
    chat_id: 'chat_101',
    pendingCount: 2,
    receiver: {
      id: 'user_1',
      full_name: 'Alex Rivera',
      profile_file: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      age: 26,
      distance: '0.8 km away',
    },
    lastMessage: {
      text: 'Hey! Are you free this evening around 8?',
      created_on: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'inbox_2',
    chat_id: 'chat_102',
    pendingCount: 1,
    receiver: {
      id: 'user_2',
      full_name: 'Julian Vance',
      profile_file: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      age: 29,
      distance: '2.1 km away',
    },
    lastMessage: {
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      created_on: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'inbox_3',
    chat_id: 'chat_103',
    pendingCount: 0,
    receiver: {
      id: 'user_3',
      full_name: 'Marcus Chen',
      profile_file: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      age: 28,
      distance: '4.5 km away',
    },
    lastMessage: {
      location: true,
      text: '📍 Central Park West',
      created_on: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 'inbox_4',
    chat_id: 'chat_104',
    pendingCount: 0,
    receiver: {
      id: 'user_4',
      full_name: 'Liam Harper',
      profile_file: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400',
      age: 31,
      distance: '5.2 km away',
    },
    lastMessage: {
      audio: true,
      created_on: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 'inbox_5',
    chat_id: 'chat_105',
    pendingCount: 0,
    receiver: {
      id: 'user_5',
      full_name: 'Noah Bennett',
      profile_file: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      age: 24,
      distance: '7.0 km away',
    },
    lastMessage: {
      text: 'That cafe near the corner is amazing!',
      created_on: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 'inbox_6',
    chat_id: 'chat_106',
    pendingCount: 0,
    receiver: {
      id: 'user_6',
      full_name: 'Ethan Morales',
      profile_file: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      age: 30,
      distance: '10.3 km away',
    },
    lastMessage: {
      text: 'Let me know whenever you arrive.',
      created_on: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  },
];

const EmptyInboxView: React.FC = () => {
  return (
    <View style={styles.emptyContainer}>
      <Card variant="filled" radius="3xl" style={styles.emptyCard}>
        <Typography variant="h3" style={styles.emptyTitle}>
          No Conversations Yet
        </Typography>
        <Typography variant="bodySm" color="secondary" style={styles.emptySubtitle}>
          Connect with nearby members and start chatting!
        </Typography>
        <Button
          variant="primary"
          size="md"
          label="Explore Nearby"
          onPress={() => simpleNavigate(homeRoutesConst.NEAR_BY)}
          style={styles.emptyButton}
        />
      </Card>
    </View>
  );
};

export function InboxScreen({user, appState}: InboxScreenProps) {
  const myProfile = user?.myProfile;
  const enableSuperGay = appState?.currentConfig?.enable_super_gay_from_inbox ?? true;

  const [inboxList, setInboxList] = useState<MockInboxItem[]>(MOCK_INBOX_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rightActions: NavbarAction[] = useMemo(() => {
    const actions: NavbarAction[] = [];

    if (!myProfile?.is_roaming) {
      actions.push({
        icon: 'Globe',
        onPress: () => simpleNavigate(routeConst.EXPLORE),
        accessibilityLabel: 'Explore',
      });
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
    );

    return actions;
  }, [myProfile]);

  const handleLeftActionPress = () => {
    simpleNavigate(routeConst.SETTINGS);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setInboxList(MOCK_INBOX_DATA);
      setIsRefreshing(false);
    }, 600);
  };

  const handleSelectConversation = (item: MockInboxItem) => {
    setInboxList(prev =>
      prev.map(conv => (conv.id === item.id ? {...conv, pendingCount: 0} : conv)),
    );
    simpleNavigate(chatNextRoutes.ONE_TO_ONE, {
      receiver: {
        _id: item.receiver.id,
        name: item.receiver.full_name,
        avatar: item.receiver.profile_file,
      },
      chatId: item.chat_id,
    });
  };

  const handleDeleteConversation = (id: string) => {
    setInboxList(prev => prev.filter(conv => conv.id !== id));
  };

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
              onPress={() => {}}
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
          renderItem={({item}) => (
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
              refreshing={isRefreshing}
            />
          }
          contentContainerStyle={inboxList.length === 0 ? styles.emptyListContent : undefined}
          ListEmptyComponent={EmptyInboxView}
          ListHeaderComponent={() => (
            <View style={styles.adHeaderContainer}>
              <BannerNearYou small />
            </View>
          )}
          ListFooterComponent={() => <View style={styles.listFooter} />}
        />
      </ScreenWrapper>
    </ActionSheetProvider>
  );
}

export default withRedux(InboxScreen);
