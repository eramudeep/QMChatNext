import { StyleSheet } from 'react-native'
import { s, vs, ms } from 'react-native-size-matters'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputToolbar: {
    paddingVertical: vs(4),
    paddingHorizontal: s(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  inputToolbarPrimary: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  composer: {
    borderRadius: 22,
    paddingHorizontal: s(14),
    paddingTop: vs(10),
    paddingBottom: vs(10),
    marginRight: s(6),
    marginLeft: 0,
    fontSize: 15,
    minHeight: vs(42),
  },
  sendContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    marginRight: s(4),
  },
  sendIconWrapper: {
    transform: [{ rotate: '-40deg' }],
    top: -2,
  },
  actionsContainer: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(4),
    marginRight: s(4),
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
    transform: [{ scaleY: -1 }],
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: vs(20),
    paddingHorizontal: s(16),
    width: '100%',
  },
  emptyTitle: {
    marginBottom: vs(4),
    marginTop: vs(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  bubbleWrapperRight: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: s(4),
    paddingVertical: vs(2),
  },
  bubbleWrapperLeft: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: s(4),
    paddingVertical: vs(2),
  },
  avatarContainer: {
    marginRight: s(4),
  },
  blockedBanner: {
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  locationWrapper: {
    width: s(220),
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: vs(4),
  },
  locationMap: {
    width: '100%',
    height: vs(120),
    borderRadius: 12,
  },
  locationInfo: {
    paddingVertical: vs(6),
    paddingHorizontal: s(8),
  },
  mediaImageWrapper: {
    width: s(200),
    height: vs(180),
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: vs(4),
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  singleViewWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(5),
    paddingHorizontal: s(6),
    gap: s(8),
  },
  singleViewIconCircle: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  singleViewIconCircleMy: {
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  singleViewIconCircleOther: {
    borderColor: 'rgba(0, 0, 0, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  singleViewIconCircleExpired: {
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'rgba(150, 150, 150, 0.18)',
  },
  singleViewText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bubbleOuterContainer: {
    position: 'relative',
    flexDirection: 'column',
  },
  bubbleOuterRight: {
    alignItems: 'flex-end',
  },
  bubbleOuterLeft: {
    alignItems: 'flex-start',
  },
  reactionBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: 12,
    borderWidth: 1,
    marginTop: -vs(8),
    marginBottom: vs(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 99,
    gap: s(3),
  },
  reactionBadgeRight: {
    marginRight: s(12),
  },
  reactionBadgeLeft: {
    marginLeft: s(12),
  },
  reactionText: {
    fontSize: 11,
    fontWeight: '600',
  },
})

export default styles
