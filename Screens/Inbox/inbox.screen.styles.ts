import { StyleSheet } from 'react-native';
import { s, vs } from 'react-native-size-matters';

export const styles = StyleSheet.create({
  boostBannerContainer: {
    paddingHorizontal: s(12),
    marginBottom: vs(8),
    marginTop: vs(4),
  },
  adHeaderContainer: {
    height: vs(70),
    marginBottom: vs(8),
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingHorizontal: s(20),
    paddingVertical: vs(30),
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: vs(24),
    paddingHorizontal: s(20),
    width: '100%',
  },
  emptyTitle: {
    marginBottom: vs(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: vs(16),
  },
  emptyButton: {
    marginTop: vs(8),
  },
  listFooter: {
    height: vs(100),
  },
});

export default styles;
