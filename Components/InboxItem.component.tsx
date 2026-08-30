import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useActionSheet} from '@expo/react-native-action-sheet';
import {s, vs} from 'react-native-size-matters';

// QM-Core Components & Theme
import {
  Avatar,
  Typography,
  Badge,
  Pressable,
  Divider,
} from 'Core/Components';
import {useTheme} from 'QM-Core';

// Helpers & Types
import {timeSince} from 'Utils/common';
import {InboxItemProps} from '../type';

export const InboxItem: React.FC<InboxItemProps> = ({item, onDelete, onSelect}) => {
  const {colors} = useTheme();
  const {showActionSheetWithOptions} = useActionSheet();

  const {receiver, lastMessage, pendingCount = 0} = item;
  const {full_name, profile_file} = receiver;

  const handlePress = () => {
    onSelect(item);
  };

  const handleLongPress = () => {
    const options = ['Delete Conversation', 'Block User', 'Cancel'];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      selectedIndex => {
        if (selectedIndex === 0) {
          onDelete(item.id);
        }
      },
    );
  };

  const getMessagePreview = () => {
    if (lastMessage.image) return '📷 Photo';
    if (lastMessage.location) return '📍 Location shared';
    if (lastMessage.audio) return '🎤 Voice Note (0:14)';
    if (lastMessage.text) return lastMessage.text;
    return 'Say hello!';
  };

  const hasUnread = pendingCount > 0;

  return (
    <>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={[
          styles.itemWrapper,
          hasUnread && {backgroundColor: colors.overlayLight},
        ]}
      >
        <Avatar
          source={{uri: profile_file}}
          initials={full_name ? full_name.charAt(0).toUpperCase() : 'U'}
          size="lg"
        />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Typography variant="bodyLg" numberOfLines={1} style={styles.userName}>
              {full_name}
            </Typography>
            <Typography variant="caption" color="tertiary">
              {timeSince(new Date(lastMessage.created_on))}
            </Typography>
          </View>
          <View style={styles.itemFooter}>
            <Typography
              variant="labelSm"
              color={hasUnread ? 'primary' : 'tertiary'}
              numberOfLines={1}
              style={styles.messagePreview}
            >
              {getMessagePreview()}
            </Typography>
            {hasUnread && (
              <Badge count={pendingCount} variant="primary" size="sm" />
            )}
          </View>
        </View>
      </Pressable>
      <Divider color="overlayLight" spacing={0.5} />
    </>
  );
};

const styles = StyleSheet.create({
  itemWrapper: {
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: s(12),
    justifyContent: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(4),
  },
  userName: {
    flex: 1,
    marginRight: s(8),
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    flex: 1,
    marginRight: s(8),
  },
});

export default InboxItem;
