import { StyleSheet } from 'react-native'
import { s, vs } from 'react-native-size-matters'

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
  listFooter: {
    height: vs(100),
  },
})

export default styles
